import { createHash } from 'node:crypto'
import { Buffer } from 'buffer'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed, defineComponent, h, PropType } from 'vue'
import { createStore } from 'vuex'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { config as loadEnv } from 'dotenv'
import BigNumber from 'bignumber.js'
import nacl from 'tweetnacl'

const TEST_PUBLIC_KEY = Buffer.from(
  '034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa',
  'hex'
)

vi.mock('tiny-secp256k1', () => ({
  isPoint: () => true,
  isOrderScalar: () => true,
  pointAdd: () => new Uint8Array(33),
  pointAddScalar: () => new Uint8Array(33),
  pointCompress: () => new Uint8Array(33),
  pointFromScalar: () => new Uint8Array(33),
  pointMultiply: () => new Uint8Array(33),
  sign: () => new Uint8Array(64),
  verify: () => true
}))

vi.mock('ecpair', () => ({
  ECPairFactory: () => ({
    fromPrivateKey: () => ({
      publicKey: TEST_PUBLIC_KEY
    }),
    fromPublicKey: () => ({
      verify: () => true
    })
  })
}))

vi.mock('@/lib/adamant-api', () => ({
  getTransaction: vi.fn(),
  decodeTransaction: vi.fn((transaction) => transaction)
}))
vi.unmock('@/lib/nodes')
vi.unmock('@/lib/nodes/adm/index')
vi.unmock('@/lib/nodes/adm')
vi.unmock('@/lib/nodes/btc-indexer/index')
vi.unmock('@/lib/nodes/doge-indexer/index')
vi.unmock('@/lib/nodes/eth-indexer/index')
vi.unmock('@/lib/nodes/dash/index')

import { cryptoTransferAsset } from '@/lib/adamant-api/asset'
import { normalizeMessage } from '@/lib/chat/helpers/normalizeMessage'
import {
  getInconsistentStatus,
  TransactionInconsistentReason
} from '@/components/transactions/utils/getInconsistentStatus'
import { useTransactionStatus } from '@/components/transactions/hooks/useTransactionStatus'
import TransactionStatusProvider from '@/providers/TransactionProvider/TransactionStatusProvider.vue'
import adamant from '@/lib/adamant'
import adm from '@/lib/nodes/adm'
import { DEFAULT_TIME_DELTA } from '@/lib/nodes/constants'
import ethIndexer from '@/lib/nodes/eth-indexer'
import btcIndexer from '@/lib/nodes/btc-indexer'
import dogeIndexer from '@/lib/nodes/doge-indexer'
import dash from '@/lib/nodes/dash'
import { createPendingTransaction, PendingTxStore } from '@/lib/pending-transactions'
import {
  Cryptos,
  CryptosInfo,
  isErc20,
  MessageType,
  Transactions,
  TransactionStatus
} from '@/lib/constants'

loadEnv({ path: '.env.local', quiet: true })

const testPassphrase = process.env.ADM_TEST_ACCOUNT_PK?.trim()
const liveDescribe = testPassphrase ? describe : describe.skip

if (!process.env.CI && !testPassphrase) {
  console.warn(
    '\n[vitest] ADM_TEST_ACCOUNT_PK is not set — live rich transfer status tests will be skipped.\n' +
      'To enable them, add the test account passphrase to .env.local.\n'
  )
}

const RECIPIENT_ADM = 'U6386412615727665758'
const TEST_FETCH_INFO = {
  newPendingInterval: 30,
  oldPendingInterval: 15,
  registeredInterval: 30,
  newPendingAttempts: 3,
  oldPendingAttempts: 2
}
const CRYPTOS_UNDER_TEST = [Cryptos.BTC, Cryptos.DOGE, Cryptos.DASH, Cryptos.ETH, 'USDT'] as const

const StatusHarness = defineComponent({
  props: {
    transaction: {
      type: Object as PropType<Record<string, any>>,
      required: true
    }
  },
  setup(props) {
    return () =>
      h(
        TransactionStatusProvider as any,
        { transaction: props.transaction },
        {
          default: ({
            status,
            queryStatus,
            inconsistentStatus
          }: {
            status: string
            queryStatus: string
            inconsistentStatus: string
          }) =>
            h('div', {
              'data-status': status,
              'data-query-status': queryStatus,
              'data-inconsistent-status': inconsistentStatus
            })
        }
      )
  }
})

type CryptoUnderTest = (typeof CRYPTOS_UNDER_TEST)[number]
const live = {
  admAddress: '',
  admKeypair: undefined as { publicKey: Uint8Array; privateKey: Uint8Array } | undefined,
  recipientPublicKey: undefined as Buffer | undefined,
  senderAddresses: {} as Record<string, string | undefined>,
  recipientAddresses: {} as Record<string, string | undefined>,
  realTransactions: {} as Partial<Record<CryptoUnderTest, any>>
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor<T>(
  label: string,
  read: () => T | Promise<T>,
  predicate: (value: T) => boolean,
  timeoutMs = 10_000
) {
  const startedAt = Date.now()
  let lastValue: T | undefined

  while (Date.now() - startedAt < timeoutMs) {
    lastValue = await read()

    if (predicate(lastValue)) {
      return lastValue
    }

    await wait(50)
  }

  throw new Error(`Timed out waiting for ${label}. Last value: ${String(lastValue)}`)
}

function buildFakeHash(label: string) {
  return createHash('sha256').update(label).digest('hex')
}

function resolveKvsMainAddress(txs: any[]) {
  if (!Array.isArray(txs) || txs.length === 0) {
    return undefined
  }

  const normalizedValues = txs
    .map((tx) => tx?.asset?.state?.value)
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim())

  if (normalizedValues.length === 0) {
    return undefined
  }

  return normalizedValues[0]
}

function markTransactionAsOld(transaction: Record<string, any>) {
  const oldTimestamp = Date.now() - 60 * 60 * 1000

  return {
    ...transaction,
    admTimestamp: Math.max(1, transaction.admTimestamp - 60 * 60),
    timestamp: oldTimestamp
  }
}

function cloneMessage<T extends Record<string, any>>(
  transaction: T,
  overrides: Record<string, any>
): T {
  return {
    ...transaction,
    ...overrides,
    asset: {
      ...transaction.asset,
      ...overrides.asset
    }
  } as T
}

function getFetchInfoTarget(crypto: CryptoUnderTest) {
  return CryptosInfo[isErc20(crypto) ? Cryptos.ETH : crypto]
}

function setShortTxFetchInfo() {
  const originals = new Map()

  for (const crypto of CRYPTOS_UNDER_TEST) {
    const target = getFetchInfoTarget(crypto)

    if (!originals.has(target.symbol)) {
      originals.set(target.symbol, { ...target.txFetchInfo })
      target.txFetchInfo = {
        ...target.txFetchInfo,
        ...TEST_FETCH_INFO
      }
    }
  }

  return () => {
    for (const crypto of CRYPTOS_UNDER_TEST) {
      const target = getFetchInfoTarget(crypto)
      const original = originals.get(target.symbol)

      if (original) {
        target.txFetchInfo = original
      }
    }
  }
}

async function fetchPublishedAddress(admAddress: string, crypto: CryptoUnderTest) {
  const key = `${(isErc20(crypto) ? Cryptos.ETH : crypto).toLowerCase()}:address`
  const response = await adm.get('/api/states/get', {
    senderId: admAddress,
    key,
    orderBy: 'timestamp:desc',
    limit: 20
  })
  const txs = response?.success ? response.transactions : []

  return resolveKvsMainAddress(txs)
}

async function sendFraudRichMessage({
  crypto,
  hash,
  amount,
  comments
}: {
  crypto: CryptoUnderTest
  hash: string
  amount: string
  comments: string
}) {
  const asset = cryptoTransferAsset({
    cryptoSymbol: crypto,
    amount,
    hash,
    comments
  })
  const encoded = adamant.encodeMessage(
    JSON.stringify(asset),
    live.recipientPublicKey!,
    live.admKeypair!.privateKey
  )
  const timestamp = Math.floor(adamant.epochTime() - DEFAULT_TIME_DELTA)
  const transaction = {
    type: Transactions.CHAT_MESSAGE,
    amount: 0,
    senderId: live.admAddress,
    senderPublicKey: Buffer.from(live.admKeypair!.publicKey).toString('hex'),
    recipientId: RECIPIENT_ADM,
    timestamp,
    asset: {
      chat: {
        message: encoded.message,
        own_message: encoded.nonce,
        type: MessageType.RICH_CONTENT_MESSAGE
      }
    },
    signature: ''
  }
  const transactionHash = adamant.getHash(transaction)
  const signature = nacl.sign.detached(
    new Uint8Array(transactionHash),
    new Uint8Array(live.admKeypair!.privateKey)
  )
  transaction.signature = Buffer.from(signature).toString('hex')
  const response = await adm.sendChatTransaction(transaction as any)

  if (!response?.success || !response.transactionId) {
    throw new Error(`Failed to send live ${crypto} rich message`)
  }

  return normalizeMessage({
    id: response.transactionId,
    senderId: live.admAddress,
    recipientId: RECIPIENT_ADM,
    timestamp: adamant.epochTime(),
    confirmations: 0,
    amount: 0,
    message: asset
  } as any)
}

function createStatusStore(transaction: Record<string, any>) {
  return createStore({
    state: {
      address: live.admAddress
    },
    modules: {
      partners: {
        namespaced: true,
        actions: {
          fetchAddress(
            _,
            { crypto, partner }: { crypto: CryptoUnderTest; partner: string | undefined }
          ) {
            const partnerAddresses =
              partner === live.admAddress ? live.senderAddresses : live.recipientAddresses

            return partnerAddresses[crypto]
          }
        }
      },
      chat: {
        namespaced: true,
        state: () => ({
          chats: {
            [RECIPIENT_ADM]: {
              messages: [transaction]
            }
          }
        }),
        mutations: {
          updateCryptoTransferMessage(
            state,
            {
              partnerId,
              hash,
              status,
              confirmations,
              instantlock,
              instantlock_internal,
              instantsend
            }
          ) {
            const chat = state.chats[partnerId]
            const message = chat?.messages.find(
              (item: Record<string, any>) => item.hash === hash || item.id === hash
            )

            if (!message) {
              return
            }

            if (status) message.status = status
            if (typeof confirmations === 'number') message.confirmations = confirmations
            if (typeof instantlock === 'boolean') message.instantlock = instantlock
            if (typeof instantlock_internal === 'boolean') {
              message.instantlock_internal = instantlock_internal
            }
            if (typeof instantsend === 'boolean') message.instantsend = instantsend
          }
        }
      },
      btc: {
        namespaced: true,
        state: () => ({ address: live.senderAddresses[Cryptos.BTC] })
      },
      doge: {
        namespaced: true,
        state: () => ({ address: live.senderAddresses[Cryptos.DOGE] })
      },
      dash: {
        namespaced: true,
        state: () => ({ address: live.senderAddresses[Cryptos.DASH] })
      },
      eth: {
        namespaced: true,
        state: () => ({ address: live.senderAddresses[Cryptos.ETH] })
      }
    }
  })
}

async function mountTransactionStatus(transaction: Record<string, any>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0
      }
    }
  })
  const store = createStatusStore(transaction)
  const wrapper = mount(StatusHarness, {
    props: { transaction },
    global: {
      plugins: [store, [VueQueryPlugin, { queryClient }]]
    }
  })

  const stop = () => {
    wrapper.unmount()
    queryClient.clear()
  }

  return { wrapper, stop }
}

liveDescribe('live rich transfer status checks from ADM_TEST_ACCOUNT_PK', () => {
  let restoreTxFetchInfo: (() => void) | undefined
  const originalTxFetchInfo = new Map<string, Record<string, number> | undefined>()

  beforeAll(async () => {
    const passphraseHash = new Uint8Array(
      Buffer.from(adamant.createPassphraseHash(testPassphrase!) as unknown as Uint8Array)
    )
    const rawAdmKeypair = adamant.makeKeypair(passphraseHash) as {
      publicKey: Uint8Array
      privateKey: Uint8Array
    }
    const admKeypair = {
      publicKey: new Uint8Array(rawAdmKeypair.publicKey),
      privateKey: new Uint8Array(rawAdmKeypair.privateKey)
    }
    live.admKeypair = admKeypair
    live.admAddress = adamant.getAddressFromPublicKey(admKeypair.publicKey)
    const publicKeyResponse = await adm.get('/api/accounts/getPublicKey', {
      address: RECIPIENT_ADM
    })
    live.recipientPublicKey = Buffer.from(publicKeyResponse.publicKey, 'hex')

    live.senderAddresses = {
      [Cryptos.BTC]: await fetchPublishedAddress(live.admAddress, Cryptos.BTC),
      [Cryptos.DOGE]: await fetchPublishedAddress(live.admAddress, Cryptos.DOGE),
      [Cryptos.DASH]: await fetchPublishedAddress(live.admAddress, Cryptos.DASH),
      [Cryptos.ETH]: await fetchPublishedAddress(live.admAddress, Cryptos.ETH),
      USDT: await fetchPublishedAddress(live.admAddress, Cryptos.ETH)
    }

    live.recipientAddresses = {
      [Cryptos.BTC]: await fetchPublishedAddress(RECIPIENT_ADM, Cryptos.BTC),
      [Cryptos.DOGE]: await fetchPublishedAddress(RECIPIENT_ADM, Cryptos.DOGE),
      [Cryptos.DASH]: await fetchPublishedAddress(RECIPIENT_ADM, Cryptos.DASH),
      [Cryptos.ETH]: await fetchPublishedAddress(RECIPIENT_ADM, Cryptos.ETH),
      USDT: await fetchPublishedAddress(RECIPIENT_ADM, Cryptos.ETH)
    }

    expect(live.senderAddresses[Cryptos.BTC]).toBeTruthy()
    expect(live.senderAddresses[Cryptos.DOGE]).toBeTruthy()
    expect(live.senderAddresses[Cryptos.DASH]).toBeTruthy()
    expect(live.senderAddresses[Cryptos.ETH]).toBeTruthy()

    const [btcTransaction] = await btcIndexer.getTransactions(live.senderAddresses[Cryptos.BTC]!)
    const [dogeTransaction] = await dogeIndexer.getTransactions(live.senderAddresses[Cryptos.DOGE]!)
    const dashTransactions = await dash.getTransactions(live.senderAddresses[Cryptos.DASH]!)
    const [ethTransaction] = await ethIndexer.getTransactions({
      address: live.senderAddresses[Cryptos.ETH]!,
      decimals: CryptosInfo.ETH.decimals,
      limit: 1
    })
    const [usdtTransaction] = await ethIndexer.getTransactions({
      address: live.senderAddresses[Cryptos.ETH]!,
      contract: (CryptosInfo.USDT as any).contractId,
      decimals: CryptosInfo.USDT.decimals,
      limit: 1
    })

    live.realTransactions = {
      [Cryptos.BTC]: btcTransaction,
      [Cryptos.DOGE]: dogeTransaction,
      [Cryptos.DASH]: dashTransactions[0],
      [Cryptos.ETH]: ethTransaction,
      USDT: usdtTransaction
    }

    for (const crypto of CRYPTOS_UNDER_TEST) {
      const target = getFetchInfoTarget(crypto)

      if (!originalTxFetchInfo.has(target.symbol)) {
        originalTxFetchInfo.set(target.symbol, { ...target.txFetchInfo })
      }
    }

    restoreTxFetchInfo = setShortTxFetchInfo()
  }, 120000)

  afterEach(() => {
    PendingTxStore.clear()
  })

  afterAll(() => {
    restoreTxFetchInfo?.()
    PendingTxStore.clear()
  })

  it.each(CRYPTOS_UNDER_TEST)(
    'marks old invalid %s rich messages as REJECTED after exhausting txFetchInfo retries',
    async (crypto) => {
      const transaction = await sendFraudRichMessage({
        crypto,
        hash: buildFakeHash(`${crypto}-old-${Date.now()}`),
        amount: '1',
        comments: `live invalid old ${crypto}`
      })
      const oldTransaction = markTransactionAsOld(transaction)
      const { wrapper, stop } = await mountTransactionStatus(oldTransaction)

      try {
        await waitFor(
          `${crypto} old status`,
          () => wrapper.find('[data-status]').attributes('data-status'),
          (value) => value === TransactionStatus.REJECTED,
          30_000
        )

        expect(wrapper.find('[data-status]').attributes('data-status')).toBe(
          TransactionStatus.REJECTED
        )
      } finally {
        stop()
      }
    },
    120000
  )

  it.each(CRYPTOS_UNDER_TEST)(
    'marks new invalid %s rich messages as REJECTED when locally tracked as pending',
    async (crypto) => {
      const hash = buildFakeHash(`${crypto}-new-${Date.now()}`)
      const transaction = await sendFraudRichMessage({
        crypto,
        hash,
        amount: '1',
        comments: `live invalid new ${crypto}`
      })

      PendingTxStore.save(
        crypto,
        createPendingTransaction({
          hash,
          senderId: live.senderAddresses[crypto]!,
          recipientId: live.recipientAddresses[crypto] || live.senderAddresses[crypto]!,
          amount: 1,
          fee: 0
        })
      )

      const { wrapper, stop } = await mountTransactionStatus(transaction)

      try {
        await waitFor(
          `${crypto} new status`,
          () => wrapper.find('[data-status]').attributes('data-status'),
          (value) => value === TransactionStatus.REJECTED,
          30_000
        )

        expect(wrapper.find('[data-status]').attributes('data-status')).toBe(
          TransactionStatus.REJECTED
        )
      } finally {
        stop()
      }
    },
    120000
  )

  it('keeps live invalid new BTC rich messages pending when the real txFetchInfo is used', async () => {
    const target = getFetchInfoTarget(Cryptos.BTC)
    const shortTxFetchInfo = { ...target.txFetchInfo }
    const liveTxFetchInfo = originalTxFetchInfo.get(target.symbol)

    target.txFetchInfo = liveTxFetchInfo

    const hash = buildFakeHash(`BTC-live-fetch-info-${Date.now()}`)
    const transaction = await sendFraudRichMessage({
      crypto: Cryptos.BTC,
      hash,
      amount: '1',
      comments: 'live invalid new BTC with live txFetchInfo'
    })

    PendingTxStore.save(
      Cryptos.BTC,
      createPendingTransaction({
        hash,
        senderId: live.senderAddresses[Cryptos.BTC]!,
        recipientId: live.recipientAddresses[Cryptos.BTC] || live.senderAddresses[Cryptos.BTC]!,
        amount: 1,
        fee: 0
      })
    )

    const { wrapper, stop } = await mountTransactionStatus(transaction)

    try {
      await wait(4_000)

      expect(wrapper.find('[data-status]').attributes('data-status')).toBe(
        TransactionStatus.PENDING
      )
    } finally {
      stop()
      target.txFetchInfo = shortTxFetchInfo
    }
  }, 120000)

  it.each(CRYPTOS_UNDER_TEST)(
    'marks falsified %s rich messages as INVALID with a live inconsistency reason',
    async (crypto) => {
      const liveTransaction = live.realTransactions[crypto]

      expect(
        liveTransaction,
        `No live ${crypto} transaction found for inconsistency test`
      ).toBeTruthy()
      const fakeAmount = new BigNumber(liveTransaction!.amount).times(1.02).toFixed()

      const admMessage = await sendFraudRichMessage({
        crypto,
        hash: liveTransaction!.hash,
        amount: fakeAmount,
        comments: `live inconsistent ${crypto}`
      })
      const { wrapper, stop } = await mountTransactionStatus(admMessage)

      try {
        await waitFor(
          `${crypto} invalid status`,
          () => wrapper.find('[data-status]').attributes('data-status'),
          (value) => value === TransactionStatus.INVALID,
          60_000
        )

        expect(wrapper.find('[data-status]').attributes('data-status')).toBe(
          TransactionStatus.INVALID
        )
        expect(wrapper.find('[data-status]').attributes('data-inconsistent-status')).toBe(
          TransactionInconsistentReason.WRONG_AMOUNT
        )
      } finally {
        stop()
      }
    },
    120000
  )

  it.each(CRYPTOS_UNDER_TEST)(
    'detects live inconsistency reasons for %s based on real chain transactions',
    async (crypto) => {
      const liveTransaction = live.realTransactions[crypto]

      expect(
        liveTransaction,
        `No live ${crypto} transaction found for inconsistency reason matrix`
      ).toBeTruthy()

      const admMessage = await sendFraudRichMessage({
        crypto,
        hash: liveTransaction!.hash,
        amount: new BigNumber(liveTransaction!.amount).toFixed(),
        comments: `live reason matrix ${crypto}`
      })
      const consistentAddresses = {
        senderCryptoAddress: liveTransaction!.senderId,
        recipientCryptoAddress: liveTransaction!.recipientId
      }
      const wrongTimestampMessage = cloneMessage(admMessage, {
        timestamp:
          liveTransaction!.timestamp +
          (CryptosInfo[isErc20(crypto) ? Cryptos.ETH : crypto].txConsistencyMaxTime || 0) +
          60_000
      })
      const derivedWrongAmount = useTransactionStatus(
        computed(() => false),
        computed(() => 'success' as const),
        computed(() => liveTransaction!.status as any),
        computed(() =>
          getInconsistentStatus(
            liveTransaction!,
            cloneMessage(admMessage, {
              amount: new BigNumber(liveTransaction!.amount).times(1.02).toFixed()
            }),
            consistentAddresses
          )
        )
      )

      expect(
        getInconsistentStatus(
          liveTransaction!,
          cloneMessage(admMessage, { hash: buildFakeHash(`${crypto}-wrong-hash`) }),
          consistentAddresses
        )
      ).toBe(TransactionInconsistentReason.WRONG_TX_HASH)
      expect(
        getInconsistentStatus(liveTransaction!, admMessage, {
          senderCryptoAddress: undefined,
          recipientCryptoAddress: liveTransaction!.recipientId
        })
      ).toBe(TransactionInconsistentReason.NO_SENDER_CRYPTO_ADDRESS)
      expect(
        getInconsistentStatus(liveTransaction!, admMessage, {
          senderCryptoAddress: liveTransaction!.senderId,
          recipientCryptoAddress: undefined
        })
      ).toBe(TransactionInconsistentReason.NO_RECIPIENT_CRYPTO_ADDRESS)
      expect(
        getInconsistentStatus(liveTransaction!, admMessage, {
          senderCryptoAddress: buildFakeHash(`${crypto}-wrong-sender`),
          recipientCryptoAddress: liveTransaction!.recipientId
        })
      ).toBe(TransactionInconsistentReason.SENDER_CRYPTO_ADDRESS_MISMATCH)
      expect(
        getInconsistentStatus(liveTransaction!, admMessage, {
          senderCryptoAddress: liveTransaction!.senderId,
          recipientCryptoAddress: buildFakeHash(`${crypto}-wrong-recipient`)
        })
      ).toBe(TransactionInconsistentReason.RECIPIENT_CRYPTO_ADDRESS_MISMATCH)
      expect(
        getInconsistentStatus(
          liveTransaction!,
          cloneMessage(admMessage, {
            amount: new BigNumber(liveTransaction!.amount).times(1.02).toFixed()
          }),
          consistentAddresses
        )
      ).toBe(TransactionInconsistentReason.WRONG_AMOUNT)
      expect(derivedWrongAmount.value).toBe(TransactionStatus.INVALID)
      expect(
        getInconsistentStatus(liveTransaction!, wrongTimestampMessage, consistentAddresses)
      ).toBe(TransactionInconsistentReason.WRONG_TIMESTAMP)
    },
    120000
  )
})
