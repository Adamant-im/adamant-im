import type { QueryStatus } from '@tanstack/vue-query'
import { computed, Ref } from 'vue'
import {
  TransactionAdditionalStatus,
  TransactionAdditionalStatusType,
  TransactionStatus,
  TransactionStatusType
} from '@/lib/constants'
import { InconsistentStatus } from '../utils/getInconsistentStatus'

export function useTransactionStatus(
  isFetching: Ref<boolean>,
  queryStatus: Ref<QueryStatus>,
  transactionStatus?: Ref<TransactionStatusType | undefined>,
  inconsistentStatus?: Ref<InconsistentStatus>,
  additionalStatus?: Ref<TransactionAdditionalStatusType | undefined>,
  isLoadingError?: Ref<boolean | undefined>,
  isRefetchError?: Ref<boolean | undefined>
) {
  return computed(() => {
    const resolvedKnownStatus =
      additionalStatus?.value === TransactionAdditionalStatus.INSTANT_SEND
        ? TransactionStatus.CONFIRMED
        : transactionStatus?.value

    if (isRefetchError?.value && resolvedKnownStatus === TransactionStatus.PENDING) {
      return TransactionStatus.REJECTED
    }

    if (queryStatus.value === 'error') {
      if (isRefetchError?.value && resolvedKnownStatus) {
        return resolvedKnownStatus
      }

      if (isLoadingError?.value || !resolvedKnownStatus) {
        return TransactionStatus.REJECTED
      }

      return resolvedKnownStatus
    }
    if (queryStatus.value === 'success') {
      if (inconsistentStatus?.value) return TransactionStatus.INVALID

      return resolvedKnownStatus || TransactionStatus.CONFIRMED
    }
    if (isFetching.value) return TransactionStatus.PENDING

    return TransactionStatus.UNKNOWN
  })
}
