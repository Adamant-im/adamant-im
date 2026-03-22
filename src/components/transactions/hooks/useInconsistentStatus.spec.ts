import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Cryptos, TransactionStatus } from '@/lib/constants'
import { TransactionInconsistentReason } from '../utils/getInconsistentStatus'

const admTransaction = ref<any>()
const senderCryptoAddress = ref<string | undefined>()
const recipientCryptoAddress = ref<string | undefined>()

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
  useKVSCryptoAddress: (admAddress: { value?: string }) =>
    computed(() =>
      admAddress.value === admTransaction.value?.senderId
        ? senderCryptoAddress.value
        : recipientCryptoAddress.value
    )
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
})
