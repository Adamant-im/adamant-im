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
  additionalStatus?: Ref<TransactionAdditionalStatusType | undefined>
) {
  return computed(() => {
    const resolvedKnownStatus =
      additionalStatus?.value === TransactionAdditionalStatus.INSTANT_SEND
        ? TransactionStatus.CONFIRMED
        : transactionStatus?.value

    if (queryStatus.value === 'error') {
      return resolvedKnownStatus || TransactionStatus.REJECTED
    }
    if (queryStatus.value === 'success') {
      if (inconsistentStatus?.value) return TransactionStatus.INVALID

      return resolvedKnownStatus || TransactionStatus.CONFIRMED
    }
    if (isFetching.value) return TransactionStatus.PENDING

    return TransactionStatus.UNKNOWN
  })
}
