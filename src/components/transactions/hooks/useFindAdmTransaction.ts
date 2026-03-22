import { computed, ComputedRef, MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import type { NormalizedChatMessageTransaction } from '@/lib/chat/helpers/normalizeMessage'

/**
 * Find ADM special message by transactionHash in the chat messages
 */
export function useFindAdmTransaction(
  hash: MaybeRef<string | undefined>,
  preferredPartnerId?: MaybeRef<string | undefined>
): ComputedRef<NormalizedChatMessageTransaction | undefined> {
  const store = useStore()

  return computed(() => {
    const hashValue = unref(hash)
    const preferredPartnerIdValue = unref(preferredPartnerId)

    let admTx: NormalizedChatMessageTransaction | undefined
    const findInMessages = (messages: Record<string, any>[] | undefined) => {
      return messages?.some((msg) => {
        if ((msg.hash && msg.hash === hashValue) || msg.id === hashValue) {
          admTx = msg as NormalizedChatMessageTransaction
        }

        return !!admTx?.id
      })
    }

    if (preferredPartnerIdValue) {
      const preferredMessages = store.state.chat.chats[preferredPartnerIdValue]?.messages as
        | Record<string, any>[]
        | undefined

      findInMessages(preferredMessages)
    }

    if (admTx?.id) {
      return admTx
    }

    // Bad news, everyone: we'll have to scan the messages
    Object.values(store.state.chat.chats).some((chat) => {
      // @ts-expect-error-next-line
      findInMessages(Object.values(chat.messages))
      return !!admTx?.id
    })
    return admTx
  })
}
