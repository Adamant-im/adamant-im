import { computed } from 'vue'
import { useStore } from 'vuex'

import { formatMarkdown } from '@/filters/formatMarkdown'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'

export function useFormatMessage(transaction: NormalizedChatMessageTransaction) {
  const store = useStore()

  const userId = computed(() => store.state.address)
  const partnerId =
    transaction.senderId === userId.value ? transaction.recipientId : transaction.senderId

  const formatMessagesOptionEnabled = store.state.options.formatMessages

  return formatMarkdown(transaction, partnerId, formatMessagesOptionEnabled)
}
