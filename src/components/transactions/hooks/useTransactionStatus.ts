import { computed, Ref } from 'vue'
import { TransactionStatus } from '@/lib/constants'
import { InconsistentStatus } from '../utils/getInconsistentStatus'

type FetchStatus = 'pending' | 'error' | 'success' // @todo import from vue-query

export function useTransactionStatus(
  isFetching: Ref<boolean>,
  fetchStatus: Ref<FetchStatus>,
  inconsistentStatus?: Ref<InconsistentStatus>
) {
  return computed(() => {
    if (isFetching.value) return TransactionStatus.PENDING
    if (fetchStatus.value === 'error') return TransactionStatus.REJECTED
    if (fetchStatus.value === 'success') {
      if (inconsistentStatus?.value) return TransactionStatus.UNKNOWN

      return TransactionStatus.CONFIRMED
    }

    return TransactionStatus.UNKNOWN
  })
}
