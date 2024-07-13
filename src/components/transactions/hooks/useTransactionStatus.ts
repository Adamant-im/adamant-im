import { computed, Ref } from 'vue'
import { TransactionStatus } from '@/lib/constants'

type FetchStatus = 'pending' | 'error' | 'success' // @todo import from vue-query

export function useTransactionStatus(isFetching: Ref<boolean>, fetchStatus: Ref<FetchStatus>) {
  return computed(() => {
    if (isFetching.value) return TransactionStatus.PENDING
    if (fetchStatus.value === 'error') return TransactionStatus.REJECTED
    if (fetchStatus.value === 'success') return TransactionStatus.CONFIRMED

    return TransactionStatus.PENDING
  })
}
