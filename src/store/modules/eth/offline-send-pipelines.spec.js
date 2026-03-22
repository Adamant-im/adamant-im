import { beforeEach, describe, expect, it, vi } from 'vitest'
import { privateKeyToAccount, TransactionFactory } from 'web3-eth-accounts'
import { keccak256 } from 'web3-utils'

const { ethApiMock, admNodeMock, pendingTransactionsMock } = vi.hoisted(() => ({
  ethApiMock: {
    assertAnyNodeOnline: vi.fn(),
    getNonce: vi.fn(),
    isTransactionFinalized: vi.fn(),
    sendSignedTransaction: vi.fn(),
    useClient: vi.fn(),
    getClient: vi.fn(() => ({ provider: {} }))
  },
  admNodeMock: {
    assertAnyNodeOnline: vi.fn()
  },
  pendingTransactionsMock: {
    assertNoPendingTransaction: vi.fn(),
    invalidatePendingTransaction: vi.fn(),
    createPendingTransaction: vi.fn((value) => value),
    PendingTxStore: {
      get: vi.fn(),
      save: vi.fn(),
      remove: vi.fn()
    }
  }
}))

vi.mock('ecpair', () => ({
  ECPairFactory: () => ({
    fromPrivateKey: () => ({
      publicKey: Buffer.alloc(33, 1)
    }),
    fromPublicKey: () => ({
      verify: () => true
    })
  })
}))

vi.mock('tiny-secp256k1', () => ({}))

vi.mock('@/store', () => ({
  default: {
    state: {},
    getters: {},
    commit: vi.fn(),
    dispatch: vi.fn()
  }
}))

vi.mock('@/lib/nodes', () => ({
  nodes: {},
  default: {},
  adm: {},
  btc: {},
  dash: {},
  doge: {},
  eth: {},
  ipfs: {}
}))

vi.mock('../../../lib/nodes/eth', () => ({
  default: ethApiMock
}))

vi.mock('../../../lib/nodes/adm', () => ({
  default: admNodeMock
}))

vi.mock('../../../lib/pending-transactions', () => pendingTransactionsMock)

vi.mock('@/utils/devTools/logger', () => ({
  logger: {
    log: vi.fn()
  }
}))

import actions from './actions'
import stateFactory from './state'
import mutations from './mutations'
import getters from './getters'
import erc20Module from '../erc20'
import { CryptosInfo } from '@/lib/constants'
import { toWei } from '@/lib/eth-utils'

const TEST_PRIVATE_KEY = '0x4c0883a6910395b37d6231471b5dbb6204fe5129617082790f5ad3cbebd0c6f4'
const ETH_RECIPIENT = '0x000000000000000000000000000000000000dEaD'

function createCommitCollector() {
  const commits = []

  return {
    commits,
    commit(type, payload) {
      commits.push({ type, payload })
    }
  }
}

function createTestAccount() {
  const web3Account = privateKeyToAccount(TEST_PRIVATE_KEY)

  return {
    address: web3Account.address,
    privateKey: TEST_PRIVATE_KEY,
    web3Account
  }
}

function createUseClientMock(estimateGasResult, estimatedTransactions) {
  ethApiMock.useClient.mockImplementation(async (callback) =>
    callback(() => ({
      estimateGas: async (transaction) => {
        estimatedTransactions.push({ ...transaction })
        return estimateGasResult
      }
    }))
  )
}

describe('offline ethereum-like send pipelines', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    ethApiMock.assertAnyNodeOnline.mockResolvedValue(undefined)
    ethApiMock.getNonce.mockResolvedValue(7n)
    ethApiMock.isTransactionFinalized.mockResolvedValue(false)
    ethApiMock.sendSignedTransaction.mockImplementation(async (rawTransaction) =>
      keccak256(rawTransaction)
    )

    pendingTransactionsMock.assertNoPendingTransaction.mockResolvedValue(undefined)
    pendingTransactionsMock.invalidatePendingTransaction.mockResolvedValue(undefined)
    pendingTransactionsMock.PendingTxStore.save.mockResolvedValue(undefined)
  })

  it('builds and signs an ETH transfer with the test account without broadcasting to a real node', async () => {
    const state = stateFactory()
    const account = createTestAccount()
    const { commits, commit } = createCommitCollector()
    const estimatedTransactions = []
    const fromTxDataSpy = vi.spyOn(TransactionFactory, 'fromTxData')

    mutations.account(state, account)
    createUseClientMock(21_000n, estimatedTransactions)

    const context = {
      state,
      getters: {
        finalGasPrice: getters.finalGasPrice(state, {}, {}, { 'eth/gasPrice': state.gasPrice })
      },
      commit,
      dispatch: vi.fn()
    }

    const hash = await actions.sendTokens(context, {
      amount: 0.123456789,
      address: ETH_RECIPIENT,
      admAddress: '',
      comments: '',
      increaseFee: true,
      replyToId: undefined
    })

    const unsignedTransaction = fromTxDataSpy.mock.calls[0][0]

    expect(hash).toMatch(/^0x[0-9a-f]{64}$/)
    expect(estimatedTransactions[0]).toEqual({
      from: state.address,
      to: ETH_RECIPIENT,
      value: BigInt(toWei(0.123456789)),
      gasPrice: BigInt(context.getters.finalGasPrice(true)),
      nonce: 7n
    })
    expect(unsignedTransaction).toMatchObject({
      from: state.address,
      to: ETH_RECIPIENT,
      value: BigInt(toWei(0.123456789)),
      gasPrice: BigInt(context.getters.finalGasPrice(true)),
      nonce: 7n
    })
    expect(unsignedTransaction.gasLimit).toBeTypeOf('bigint')
    expect(unsignedTransaction.gasLimit).toBeGreaterThan(21_000n)
    expect(ethApiMock.sendSignedTransaction).toHaveBeenCalledTimes(1)
    expect(pendingTransactionsMock.PendingTxStore.save).toHaveBeenCalledWith(
      'ETH',
      expect.objectContaining({
        senderId: state.address,
        recipientId: ETH_RECIPIENT,
        nonce: 7
      })
    )
    expect(commits).toContainEqual(
      expect.objectContaining({
        type: 'transactions',
        payload: expect.arrayContaining([expect.objectContaining({ recipientId: ETH_RECIPIENT })])
      })
    )

    fromTxDataSpy.mockRestore()
  })

  it('builds and signs a USDT transfer with contract calldata using the test account', async () => {
    const usdtModule = erc20Module('USDT', CryptosInfo.USDT.contractId, CryptosInfo.USDT.decimals)
    const state = usdtModule.state
    const account = createTestAccount()
    const estimatedTransactions = []
    const fromTxDataSpy = vi.spyOn(TransactionFactory, 'fromTxData')

    usdtModule.mutations.account(state, account)
    createUseClientMock(65_000n, estimatedTransactions)

    const context = {
      state,
      getters: {
        finalGasPrice: usdtModule.getters.finalGasPrice(
          state,
          {},
          {},
          { 'eth/gasPrice': '1500000000' }
        )
      },
      commit: vi.fn(),
      dispatch: vi.fn()
    }

    const hash = await usdtModule.actions.sendTokens(context, {
      amount: 12.345678,
      address: ETH_RECIPIENT,
      admAddress: '',
      comments: '',
      increaseFee: false,
      replyToId: undefined
    })

    const unsignedTransaction = fromTxDataSpy.mock.calls[0][0]

    expect(hash).toMatch(/^0x[0-9a-f]{64}$/)
    expect(estimatedTransactions[0]).toMatchObject({
      from: state.address,
      to: state.contractAddress,
      value: '0x0',
      nonce: 7n
    })
    expect(estimatedTransactions[0].data).toMatch(/^0xa9059cbb/)
    expect(unsignedTransaction).toMatchObject({
      from: state.address,
      to: state.contractAddress,
      value: '0x0',
      gasPrice: BigInt(context.getters.finalGasPrice(false)),
      nonce: 7n
    })
    expect(unsignedTransaction.data).toMatch(/^0xa9059cbb/)
    expect(unsignedTransaction.gasLimit).toBeTypeOf('bigint')
    expect(unsignedTransaction.gasLimit).toBeGreaterThan(65_000n)
    expect(ethApiMock.sendSignedTransaction).toHaveBeenCalledTimes(1)
    expect(pendingTransactionsMock.PendingTxStore.save).toHaveBeenCalledWith(
      'USDT',
      expect.objectContaining({
        senderId: state.address,
        recipientId: ETH_RECIPIENT,
        nonce: 7
      })
    )

    fromTxDataSpy.mockRestore()
  })
})
