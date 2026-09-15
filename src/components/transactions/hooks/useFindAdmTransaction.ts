import { computed, ComputedRef, MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import type { NormalizedChatMessageTransaction } from '@/lib/chat/helpers/normalizeMessage'

type FindAdmTransactionOptions = {
  /**
   * Scan every chat when the preferred chats do not contain the transaction. Lists that render
   * many rows should disable it: each row would otherwise walk all loaded messages.
   */
  searchAllChats?: boolean
}

/**
 * Find ADM special message by transactionHash in the chat messages
 */
export function useFindAdmTransaction(
  hash: MaybeRef<string | undefined>,
  preferredPartnerId?: MaybeRef<string | string[] | undefined>,
  { searchAllChats = true }: FindAdmTransactionOptions = {}
): ComputedRef<NormalizedChatMessageTransaction | undefined> {
  const store = useStore()

  return computed(() => {
    const hashValue = unref(hash)
    if (!hashValue) return undefined
    const preferredPartnerIdValue = unref(preferredPartnerId)
    const preferredPartnerIds = (
      Array.isArray(preferredPartnerIdValue) ? preferredPartnerIdValue : [preferredPartnerIdValue]
    ).filter((partnerId): partnerId is string => !!partnerId)

    let admTx: NormalizedChatMessageTransaction | undefined
    const findInMessages = (messages: Record<string, any>[] | undefined) => {
      return messages?.some((msg) => {
        if ((msg.hash && msg.hash === hashValue) || msg.id === hashValue) {
          admTx = msg as NormalizedChatMessageTransaction
        }

        return !!admTx?.id
      })
    }

    preferredPartnerIds.some((partnerId) => {
      const preferredMessages = store.state.chat.chats[partnerId]?.messages as
        Record<string, any>[] | undefined

      findInMessages(preferredMessages)
      return !!admTx?.id
    })

    if (admTx?.id || !searchAllChats) {
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
