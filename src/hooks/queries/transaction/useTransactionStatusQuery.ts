import { computed, MaybeRef, unref, watch } from 'vue'
import { useInconsistentStatus } from '@/components/transactions/hooks/useInconsistentStatus'
import { useTransactionStatus } from '@/components/transactions/hooks/useTransactionStatus'
import { CryptoSymbol, TransactionStatus } from '@/lib/constants'
import { useTransactionQuery } from './useTransactionQuery'
import { UseTransactionQueryParams } from './types'
import { useFinalTransactions } from '@/stores/final-transactions'
import { storeToRefs } from 'pinia'

export function useTransactionStatusQuery(
  transactionId: MaybeRef<string>,
  crypto: MaybeRef<CryptoSymbol>,
  params: UseTransactionQueryParams = {}
) {
  const finalTransactionsStore = useFinalTransactions()

  const { addTransaction, removeTransaction } = finalTransactionsStore

  const { list } = storeToRefs(finalTransactionsStore)

  const {
    status: queryStatus,
    isFetching,
    data: transaction,
    refetch
  } = useTransactionQuery(transactionId, unref(crypto), params)

  const refetcher = () => {
    removeTransaction(unref(transactionId))

    refetch()
  }

  const finalStatus = computed(() => list.value[unref(transactionId)])
  const inconsistentStatus = useInconsistentStatus(transaction, unref(crypto))
  const transactionStatus = computed(() => {
    if (finalStatus.value) {
      return finalStatus.value
    }

    if (transaction.value && 'status' in transaction.value) {
      return transaction.value.status
    }

    return undefined
  })
  const status = useTransactionStatus(
    isFetching,
    queryStatus,
    transactionStatus,
    inconsistentStatus
  )

  watch(status, (value) => {
    if (value === TransactionStatus.REJECTED || value === TransactionStatus.CONFIRMED) {
      addTransaction(unref(transactionId), value)
    }
  })

  return {
    queryStatus,
    inconsistentStatus,
    status,
    refetch: refetcher,
    finalStatus
  }
}
