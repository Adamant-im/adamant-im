import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Cryptos, TransactionStatus } from '@/lib/constants'
import { TransactionInconsistentReason } from '../utils/getInconsistentStatus'

const admTransaction = ref<any>()
const senderCryptoAddress = ref<string | undefined>()
const recipientCryptoAddress = ref<string | undefined>()
const senderCryptoAddressStatus = ref<'pending' | 'success' | 'error'>('success')
const recipientCryptoAddressStatus = ref<'pending' | 'success' | 'error'>('success')

vi.mock('vuex', () => ({
  useStore: () => ({
    state: {
      btc: { address: 'my-btc-address' },
      eth: { address: 'my-eth-address' }
    }
  })
}))

vi.mock('./useFindAdmTransaction', () => ({
  useFindAdmTransaction: () => computed(() => admTransaction.value)
}))

vi.mock('@/hooks/queries/useKVSCryptoAddress', () => ({
  useKVSCryptoAddress: (admAddress: { value?: string }) => ({
    data: computed(() =>
      admAddress.value === admTransaction.value?.senderId
        ? senderCryptoAddress.value
        : recipientCryptoAddress.value
    ),
    status: computed(() =>
      admAddress.value === admTransaction.value?.senderId
        ? senderCryptoAddressStatus.value
        : recipientCryptoAddressStatus.value
    )
  })
}))

import { useInconsistentStatus } from './useInconsistentStatus'

describe('useInconsistentStatus', () => {
  beforeEach(() => {
    admTransaction.value = {
      id: 'adm-1',
      hash: 'tx-1',
      senderId: 'sender-adm',
      recipientId: 'recipient-adm',
      amount: 1,
      timestamp: Date.now(),
      confirmations: 0,
      status: TransactionStatus.PENDING,
      type: Cryptos.BTC,
      message: '',
      asset: {}
    }
    senderCryptoAddress.value = 'chain-sender'
    recipientCryptoAddress.value = 'chain-recipient'
    senderCryptoAddressStatus.value = 'success'
    recipientCryptoAddressStatus.value = 'success'
  })

  it('reports missing recipient KVS address as an inconsistent status', () => {
    recipientCryptoAddress.value = undefined

    const result = useInconsistentStatus(
      ref({
        id: 'tx-1',
        hash: 'tx-1',
        fee: 0,
        status: TransactionStatus.CONFIRMED,
        timestamp: Date.now(),
        direction: 'from',
        senderId: 'chain-sender',
        recipientId: 'chain-recipient',
        amount: 1,
        confirmations: 1
      }) as any,
      Cryptos.BTC
    )

    expect(result.value).toBe(TransactionInconsistentReason.NO_RECIPIENT_CRYPTO_ADDRESS)
  })

  it('reports missing sender KVS address as an inconsistent status', () => {
    senderCryptoAddress.value = undefined

    const result = useInconsistentStatus(
      ref({
        id: 'tx-1',
        hash: 'tx-1',
        fee: 0,
        status: TransactionStatus.CONFIRMED,
        timestamp: Date.now(),
        direction: 'from',
        senderId: 'chain-sender',
        recipientId: 'chain-recipient',
        amount: 1,
        confirmations: 1
      }) as any,
      Cryptos.BTC
    )

    expect(result.value).toBe(TransactionInconsistentReason.NO_SENDER_CRYPTO_ADDRESS)
  })

  it('does not mark locally pending placeholder transactions as inconsistent', () => {
    const result = useInconsistentStatus(
      ref({
        id: 'tx-1',
        hash: 'tx-1',
        fee: 0,
        status: TransactionStatus.PENDING,
        timestamp: Date.now(),
        direction: 'from',
        senderId: 'wrong-sender',
        recipientId: 'wrong-recipient',
        amount: 999,
        confirmations: 0
      }) as any,
      Cryptos.BTC
    )

    expect(result.value).toBe('')
  })

  it('waits for KVS address lookups before marking a transaction as inconsistent', () => {
    recipientCryptoAddress.value = undefined
    recipientCryptoAddressStatus.value = 'pending'

    const result = useInconsistentStatus(
      ref({
        id: 'tx-1',
        hash: 'tx-1',
        fee: 0,
        status: TransactionStatus.CONFIRMED,
        timestamp: Date.now(),
        direction: 'from',
        senderId: 'chain-sender',
        recipientId: 'chain-recipient',
        amount: 1,
        confirmations: 1
      }) as any,
      Cryptos.BTC
    )

    expect(result.value).toBe('')
  })

  it('never marks native ADM transactions as inconsistent', () => {
    recipientCryptoAddress.value = undefined
    senderCryptoAddress.value = undefined

    const result = useInconsistentStatus(
      ref({
        id: 'tx-1',
        fee: 0.5,
        amount: 1,
        senderId: 'sender-adm',
        recipientId: 'recipient-adm',
        message: 'hello',
        status: TransactionStatus.CONFIRMED,
        timestamp: Date.now()
      }) as any,
      Cryptos.ADM
    )

    expect(result.value).toBe('')
  })

  it('prefers the explicitly provided ADM transaction over a global hash match', () => {
    admTransaction.value = {
      id: 'wrong-adm',
      hash: 'tx-1',
      senderId: 'sender-adm',
      recipientId: 'recipient-adm',
      amount: 999,
      timestamp: Date.now(),
      confirmations: 1,
      status: TransactionStatus.CONFIRMED,
      type: Cryptos.BTC,
      message: '',
      asset: {}
    }

    const result = useInconsistentStatus(
      ref({
        id: 'tx-1',
        hash: 'tx-1',
        fee: 0,
        status: TransactionStatus.CONFIRMED,
        timestamp: Date.now(),
        direction: 'from',
        senderId: 'chain-sender',
        recipientId: 'chain-recipient',
        amount: 1,
        confirmations: 1
      }) as any,
      Cryptos.BTC,
      computed(
        () =>
          ({
            id: 'right-adm',
            hash: 'tx-1',
            senderId: 'sender-adm',
            recipientId: 'recipient-adm',
            amount: 1,
            timestamp: Date.now(),
            confirmations: 1,
            status: TransactionStatus.CONFIRMED,
            type: Cryptos.BTC,
            message: '',
            asset: {}
          }) as any
      )
    )

    expect(result.value).toBe('')
  })
})
