import type { QueryStatus } from '@tanstack/vue-query'
import { computed, Ref } from 'vue'
import { TransactionStatus } from '@/lib/constants'
import { InconsistentStatus } from '../utils/getInconsistentStatus'

export function useTransactionStatus(
  isFetching: Ref<boolean>,
  queryStatus: Ref<QueryStatus>,
  inconsistentStatus?: Ref<InconsistentStatus>
) {
  return computed(() => {
    if (isFetching.value) return TransactionStatus.PENDING
    if (queryStatus.value === 'error') return TransactionStatus.REJECTED
    if (queryStatus.value === 'success') {
      if (inconsistentStatus?.value) return TransactionStatus.INVALID

      return TransactionStatus.CONFIRMED
    }

    return TransactionStatus.UNKNOWN
  })
}
