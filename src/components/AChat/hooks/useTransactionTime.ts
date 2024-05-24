import { computed, ComputedRef } from 'vue'

import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import formatDate from '@/filters/date'

export function useTransactionTime(
  transaction: NormalizedChatMessageTransaction
): ComputedRef<string> {
  return computed(() => formatDate(transaction.timestamp))
}
