import { MaybeRef, Ref, unref, watch } from 'vue'
import { useStore } from 'vuex'
import { CryptoSymbol, TransactionStatus } from '@/lib/constants'
import { CoinTransaction } from '@/lib/nodes/types/transaction'
import { PendingTxStore } from '@/lib/pending-transactions'

export function useClearPendingTransaction(
  crypto: MaybeRef<CryptoSymbol>,
  transaction: Ref<CoinTransaction | undefined>
) {
  const store = useStore()

  watch(
    transaction,
    (transaction) => {
      const cryptoSymbol = unref(crypto)
      const cryptoModule = cryptoSymbol.toLowerCase()

      const pendingTransaction = PendingTxStore.get(cryptoSymbol)
      const isPendingTransaction = pendingTransaction?.id === transaction?.id
      const isFinalized =
        transaction?.status === TransactionStatus.CONFIRMED ||
        transaction?.status === TransactionStatus.REJECTED

      if (isPendingTransaction && isFinalized) {
        PendingTxStore.remove(cryptoSymbol)
        store.dispatch(`${cryptoModule}/getNewTransactions`)
      }
    },
    {
      immediate: true
    }
  )
}
