import { computed, ComputedRef } from 'vue'
import { useStore } from 'vuex'

import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'

export function usePartnerId(transaction: NormalizedChatMessageTransaction): ComputedRef<string> {
  const store = useStore()

  return computed(() => {
    if (transaction.senderId === store.state.address) {
      return transaction.recipientId
    }

    return transaction.senderId
  })
}
