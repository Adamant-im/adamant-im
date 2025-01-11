import { MaybeRef } from 'vue'

export type UseTransactionQueryParams = {
  refetchOnMount?: boolean
  enabled?: MaybeRef<boolean | undefined>
}
