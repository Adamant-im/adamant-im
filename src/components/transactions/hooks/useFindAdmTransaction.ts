import { computed, ComputedRef, MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'

/**
 * Find ADM special message by transactionHash in the chat messages
 */
export function useFindAdmTransaction(
  hash: MaybeRef<string | undefined>
): ComputedRef<NormalizedChatMessageTransaction | undefined> {
  const store = useStore()

  return computed(() => {
    const hashValue = unref(hash)

    let admTx: NormalizedChatMessageTransaction | undefined
    // Bad news, everyone: we'll have to scan the messages
    Object.values(store.state.chat.chats).some((chat) => {
      // @ts-expect-error-next-line
      Object.values(chat.messages).some((msg) => {
        // @ts-expect-error-next-line
        if (msg.hash && msg.hash === hashValue) {
          admTx = msg as NormalizedChatMessageTransaction
        }
        return !!admTx?.id
      })
      return !!admTx?.id
    })
    return admTx
  })
}
