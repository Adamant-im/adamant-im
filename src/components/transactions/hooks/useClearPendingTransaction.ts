import { computed, MaybeRef, Ref, unref, watch } from 'vue'
import { useStore } from 'vuex'
import { CryptoSymbol, TransactionStatus, TransactionStatusType } from '@/lib/constants'
import { CoinTransaction } from '@/lib/nodes/types/transaction'
import { PendingTxStore } from '@/lib/pending-transactions'

export function useClearPendingTransaction(
  crypto: MaybeRef<CryptoSymbol>,
  transaction: Ref<CoinTransaction | undefined>,
  transactionStatus?: MaybeRef<TransactionStatusType | undefined>
) {
  const store = useStore()
  const resolvedStatus = computed(() => unref(transactionStatus) ?? transaction.value?.status)

  watch(
    resolvedStatus,
    (status, previousStatus) => {
      const cryptoSymbol = unref(crypto)
      const cryptoModule = cryptoSymbol.toLowerCase()
      const currentTransaction = transaction.value

      const pendingTransaction = PendingTxStore.get(cryptoSymbol)
      const isPendingTransaction = pendingTransaction?.id === currentTransaction?.id
      const hasStatusChanged = status !== previousStatus
      const shouldRefreshStore =
        status === TransactionStatus.REGISTERED ||
        status === TransactionStatus.CONFIRMED ||
        status === TransactionStatus.REJECTED
      const isFinalized =
        status === TransactionStatus.CONFIRMED || status === TransactionStatus.REJECTED

      if (!isPendingTransaction || !status || !hasStatusChanged || !shouldRefreshStore) {
        return
      }

      if (isFinalized) {
        PendingTxStore.remove(cryptoSymbol)
      }

      void store.dispatch(`${cryptoModule}/getNewTransactions`)
    },
    {
      immediate: true
    }
  )
}
