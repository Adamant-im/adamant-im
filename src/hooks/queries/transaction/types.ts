import { MaybeRef } from 'vue'
import { TransactionStatusType } from '@/lib/constants'
import type { NormalizedChatMessageTransaction } from '@/lib/chat/helpers/normalizeMessage'

export type UseTransactionQueryParams = {
  refetchOnMount?: boolean
  enabled?: MaybeRef<boolean | undefined>
  knownStatus?: MaybeRef<TransactionStatusType | undefined>
  knownAdmTransaction?: MaybeRef<NormalizedChatMessageTransaction | undefined>
}
