import { MaybeRef } from 'vue'
import { TransactionStatusType } from '@/lib/constants'

export type UseTransactionQueryParams = {
  refetchOnMount?: boolean
  enabled?: MaybeRef<boolean | undefined>
  knownStatus?: MaybeRef<TransactionStatusType | undefined>
}
