import { computed, Ref } from 'vue'
import { useStore } from 'vuex'
import { useFindAdmTransaction } from './useFindAdmTransaction'
import { useKVSCryptoAddress } from '@/hooks/queries/useKVSCryptoAddress.ts'
import { CryptoSymbol } from '@/lib/constants'
import { getInconsistentStatus, InconsistentStatus } from '../utils/getInconsistentStatus'
import { CoinTransaction } from '@/lib/nodes/types/transaction'

export function useInconsistentStatus(
  transaction: Ref<CoinTransaction | null>,
  crypto: CryptoSymbol
) {
  const store = useStore()

  const mineCryptoAddress = computed(() => store.state[crypto.toLowerCase()].address)
  const transactionId = computed(() => transaction.value?.id)

  const admTx = useFindAdmTransaction(transactionId)
  const senderId = computed(() => admTx.value?.senderId)
  const recipientId = computed(() => admTx.value?.recipientId)
  const senderCryptoAddress = useKVSCryptoAddress(senderId, crypto)
  const recipientCryptoAddress = useKVSCryptoAddress(recipientId, crypto)

  return computed<InconsistentStatus>(() => {
    if (
      !transaction.value ||
      !admTx.value ||
      !mineCryptoAddress.value ||
      !senderCryptoAddress.value ||
      !recipientCryptoAddress.value
    )
      return ''

    return getInconsistentStatus(transaction.value, admTx.value, {
      senderCryptoAddress: senderCryptoAddress.value,
      recipientCryptoAddress: recipientCryptoAddress.value
    })
  })
}
