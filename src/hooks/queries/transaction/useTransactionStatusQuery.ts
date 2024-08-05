import { MaybeRef, unref } from 'vue'
import { useInconsistentStatus } from '@/components/transactions/hooks/useInconsistentStatus'
import { useTransactionStatus } from '@/components/transactions/hooks/useTransactionStatus'
import { CryptoSymbol } from '@/lib/constants'
import { useTransactionQuery } from './useTransactionQuery'

export function useTransactionStatusQuery(
  transactionId: MaybeRef<string>,
  crypto: MaybeRef<CryptoSymbol>
) {
  const {
    status: queryStatus,
    isFetching,
    data: transaction,
    refetch
  } = useTransactionQuery(transactionId, unref(crypto))
  const inconsistentStatus = useInconsistentStatus(transaction, unref(crypto))
  const status = useTransactionStatus(isFetching, queryStatus, inconsistentStatus)

  return {
    queryStatus,
    inconsistentStatus,
    status,
    refetch
  }
}
