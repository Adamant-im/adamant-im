import { MaybeRef, unref } from 'vue'
import { useInconsistentStatus } from '@/components/transactions/hooks/useInconsistentStatus'
import { useTransactionStatus } from '@/components/transactions/hooks/useTransactionStatus'
import { CryptoSymbol } from '@/lib/constants'
import { useTransactionQuery } from './useTransactionQuery'
import { UseTransactionQueryParams } from './types'

export function useTransactionStatusQuery(
  transactionId: MaybeRef<string>,
  crypto: MaybeRef<CryptoSymbol>,
  params: UseTransactionQueryParams = {}
) {
  const {
    status: queryStatus,
    isFetching,
    data: transaction,
    refetch
  } = useTransactionQuery(transactionId, unref(crypto), params)
  const inconsistentStatus = useInconsistentStatus(transaction, unref(crypto))
  const status = useTransactionStatus(isFetching, queryStatus, inconsistentStatus)

  return {
    queryStatus,
    inconsistentStatus,
    status,
    refetch
  }
}
