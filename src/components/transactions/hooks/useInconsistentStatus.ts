import { computed, MaybeRef, Ref, unref } from 'vue'
import { useStore } from 'vuex'
import { useFindAdmTransaction } from './useFindAdmTransaction'
import { useKVSCryptoAddress } from '@/hooks/queries/useKVSCryptoAddress'
import { Cryptos, CryptoSymbol, isErc20 } from '@/lib/constants'
import type { DecodedChatMessageTransaction } from '@/lib/adamant-api'
import type { NormalizedChatMessageTransaction } from '@/lib/chat/helpers/normalizeMessage'
import { getInconsistentStatus, InconsistentStatus } from '../utils/getInconsistentStatus'
import {
  BtcTransaction,
  DashTransaction,
  DogeTransaction,
  Erc20Transaction,
  EthTransaction
} from '@/lib/nodes/types/transaction'
import { PendingTransaction } from '@/lib/pending-transactions'

export function useInconsistentStatus(
  transaction: Ref<
    | BtcTransaction
    | DogeTransaction
    | DashTransaction
    | EthTransaction
    | Erc20Transaction
    | PendingTransaction
    | DecodedChatMessageTransaction
    | undefined
  >,
  crypto: CryptoSymbol,
  knownAdmTransaction?: MaybeRef<NormalizedChatMessageTransaction | undefined>
) {
  const store = useStore()
  const isAdmCrypto = crypto === Cryptos.ADM

  const mineCryptoAddress = computed(() => {
    if (isAdmCrypto) return store.state.address

    if (isErc20(crypto)) return store.state.eth.address

    return store.state[crypto.toLowerCase()].address
  })
  const transactionId = computed(() => transaction.value?.id)

  const foundAdmTx = useFindAdmTransaction(transactionId)
  const admTx = computed(() => unref(knownAdmTransaction) || foundAdmTx.value)
  const senderId = computed(() => admTx.value?.senderId)
  const recipientId = computed(() => admTx.value?.recipientId)
  const senderCryptoAddress = useKVSCryptoAddress(senderId, crypto)
  const recipientCryptoAddress = useKVSCryptoAddress(recipientId, crypto)
  const isSenderOwnAddress = computed(
    () => !!admTx.value?.senderId && admTx.value.senderId === store.state.address
  )
  const isRecipientOwnAddress = computed(
    () => !!admTx.value?.recipientId && admTx.value.recipientId === store.state.address
  )

  return computed<InconsistentStatus>(() => {
    if (isAdmCrypto) {
      return ''
    }

    if (!transaction.value || !admTx.value || !mineCryptoAddress.value) {
      return ''
    }

    if ('status' in transaction.value && transaction.value.status === 'PENDING') {
      return ''
    }

    const resolvedSenderCryptoAddress =
      senderCryptoAddress.value || (isSenderOwnAddress.value ? mineCryptoAddress.value : undefined)
    const resolvedRecipientCryptoAddress =
      recipientCryptoAddress.value ||
      (isRecipientOwnAddress.value ? mineCryptoAddress.value : undefined)

    return getInconsistentStatus(transaction.value, admTx.value, {
      senderCryptoAddress: resolvedSenderCryptoAddress,
      recipientCryptoAddress: resolvedRecipientCryptoAddress
    })
  })
}
