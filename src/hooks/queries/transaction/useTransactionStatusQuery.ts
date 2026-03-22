import { computed, MaybeRef, unref } from 'vue'
import { useTransactionAdditionalStatus } from '@/components/transactions/hooks/useTransactionAdditionalStatus'
import { useInconsistentStatusState } from '@/components/transactions/hooks/useInconsistentStatus'
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
    isLoadingError,
    isRefetchError,
    error,
    data: transaction,
    refetch
  } = useTransactionQuery(transactionId, unref(crypto), params)
  const { status: inconsistentStatus, isResolving: isInconsistentStatusResolving } =
    useInconsistentStatusState(transaction, unref(crypto), params.knownAdmTransaction)
  const additionalStatus = useTransactionAdditionalStatus(transaction, unref(crypto))
  const transactionStatus = computed(() => {
    if (transaction.value && 'status' in transaction.value) {
      return transaction.value.status
    }

    return params.knownStatus ? unref(params.knownStatus) : undefined
  })
  const status = useTransactionStatus(
    isFetching,
    queryStatus,
    transactionStatus,
    inconsistentStatus,
    isInconsistentStatusResolving,
    additionalStatus,
    isLoadingError,
    isRefetchError,
    error
  )

  return {
    transaction,
    queryStatus,
    isLoadingError,
    isRefetchError,
    error,
    inconsistentStatus,
    isInconsistentStatusResolving,
    additionalStatus,
    status,
    refetch
  }
}
