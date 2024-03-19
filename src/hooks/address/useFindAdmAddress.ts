import { computed, MaybeRef, Ref, unref } from 'vue'
import { useStore } from 'vuex'
import { isStringEqualCI } from '@/lib/textHelpers'

/**
 * Find ADM address by cryptoAddress or transactionHash
 *
 * 1. Scan partners module first
 * 2. If not found, scan chat messages
 *
 * @param crypto - Crypto symbol e.g. 'btc' | 'eth'
 * @param cryptoAddress - Crypto address
 * @param transactionHash - Transaction hash
 */
export function useFindAdmAddress(
  crypto: Ref<string>,
  cryptoAddress: MaybeRef<string>,
  transactionHash: MaybeRef<string>
) {
  const store = useStore()

  return computed(() => {
    let admAddress = ''

    const cryptoAddressValue = unref(cryptoAddress)
    const transactionHashValue = unref(transactionHash)

    // First, check the known partners
    const partners = store.state.partners
    Object.keys(partners).some((uid) => {
      const partner = partners[uid]
      if (isStringEqualCI(partner[crypto.value], cryptoAddressValue)) {
        admAddress = uid
      }
      return !!admAddress
    })

    if (!admAddress) {
      // Bad news, everyone: we'll have to scan the messages
      Object.values(store.state.chat.chats).some((chat) => {
        // @ts-expect-error-next-line
        Object.values(chat.messages).some((msg) => {
          // @ts-expect-error-next-line
          if (msg.hash && msg.hash === transactionHashValue) {
            // @ts-expect-error-next-line
            admAddress = isStringEqualCI(msg.senderId, store.state.address)
              ? // @ts-expect-error-next-line
                msg.recipientId
              : // @ts-expect-error-next-line
                msg.senderId
          }
          return !!admAddress
        })
        return !!admAddress
      })
    }

    return admAddress
  })
}
