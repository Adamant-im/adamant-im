import type { QueryStatus } from '@tanstack/vue-query'
import { computed, MaybeRef, Ref, unref, watch } from 'vue'
import { useStore } from 'vuex'
import { CryptoSymbol, TransactionStatus, TransactionStatusType } from '@/lib/constants'
import type { NormalizedChatMessageTransaction } from '@/lib/chat/helpers/normalizeMessage'
import { getPartnerAddress } from '../utils/getPartnerAddress'
import {
  forgetTransactionFinalStatus,
  makeTransactionStatusSessionKey
} from '@/providers/TransactionProvider/sessionFinalStatusCache'

const FINAL_TRANSACTION_STATUSES = new Set<TransactionStatusType>([
  TransactionStatus.CONFIRMED,
  TransactionStatus.REJECTED,
  TransactionStatus.INVALID
])

export function useSyncChatTransferPendingStatus(
  crypto: MaybeRef<CryptoSymbol>,
  transactionId: MaybeRef<string>,
  chatTransaction: Ref<NormalizedChatMessageTransaction | undefined>,
  isFetching: Ref<boolean>,
  queryStatus?: Ref<QueryStatus>
) {
  const store = useStore()

  const partnerId = computed(() => {
    const localChatTransaction = chatTransaction.value

    if (!localChatTransaction) {
      return ''
    }

    return getPartnerAddress(
      localChatTransaction.senderId,
      localChatTransaction.recipientId,
      store.state.address
    )
  })

  const syncPendingStatus = () => {
    const localChatTransaction = chatTransaction.value
    const transactionKey = makeTransactionStatusSessionKey(
      store.state.address,
      unref(crypto),
      unref(transactionId)
    )

    if (
      !localChatTransaction ||
      !partnerId.value ||
      !FINAL_TRANSACTION_STATUSES.has(localChatTransaction.status)
    ) {
      return
    }

    forgetTransactionFinalStatus(transactionKey)

    store.commit('chat/updateCryptoTransferMessage', {
      partnerId: partnerId.value,
      hash: localChatTransaction.hash || localChatTransaction.id,
      status: TransactionStatus.PENDING
    })
  }

  watch(
    () => (queryStatus ? queryStatus.value === 'pending' || isFetching.value : isFetching.value),
    (shouldSyncPending) => {
      if (shouldSyncPending) {
        syncPendingStatus()
      }
    },
    { immediate: true }
  )

  return {
    syncPendingStatus
  }
}
