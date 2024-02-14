import { computed, MaybeRef, unref } from 'vue'
import { useStore } from 'vuex'

/**
 * Find ADM special message by transactionHash in the chat messages
 */
export function useFindAdmTransaction(hash: MaybeRef<string>) {
  const store = useStore()

  return computed(() => {
    const hashValue = unref(hash)

    const admTx = {} as any
    // Bad news, everyone: we'll have to scan the messages
    Object.values(store.state.chat.chats).some((chat) => {
      // @ts-expect-error-next-line
      Object.values(chat.messages).some((msg) => {
        // @ts-expect-error-next-line
        if (msg.hash && msg.hash === hashValue) {
          Object.assign(admTx, msg)
        }
        return !!admTx.id
      })
      return !!admTx.id
    })
    return admTx
  })
}
