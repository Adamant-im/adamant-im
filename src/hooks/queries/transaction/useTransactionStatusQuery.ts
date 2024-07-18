import { computed, MaybeRef, unref } from 'vue'
import { useInconsistentStatus } from '@/components/transactions/hooks/useInconsistentStatus'
import { CryptoSymbol, TransactionStatus, TransactionStatusType } from '@/lib/constants'
import { useTransactionQuery } from './useTransactionQuery'

export function useTransactionStatusQuery(
  transactionId: MaybeRef<string>,
  crypto: MaybeRef<CryptoSymbol>
) {
  const {
    status: fetchStatus,
    isFetching,
    data: transaction,
    refetch
  } = useTransactionQuery(transactionId, unref(crypto))
  const inconsistentStatus = useInconsistentStatus(transaction, unref(crypto))

  const status = computed<TransactionStatusType>(() => {
    if (isFetching.value) return TransactionStatus.PENDING
    if (fetchStatus.value === 'error') return TransactionStatus.UNKNOWN
    if (fetchStatus.value === 'success') {
      if (inconsistentStatus.value) return TransactionStatus.INVALID

      return TransactionStatus.CONFIRMED
    }

    return TransactionStatus.UNKNOWN
  })

  return {
    fetchStatus,
    inconsistentStatus,
    status,
    refetch
  }
}
