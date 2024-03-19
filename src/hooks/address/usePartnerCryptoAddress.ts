import { isStringEqualCI } from '@/lib/textHelpers'
import { computed, MaybeRef, Ref, unref } from 'vue'

export function usePartnerCryptoAddress(
  ownAddress: Ref<string>,
  senderId: MaybeRef<string>,
  recipientId: MaybeRef<string>
) {
  return computed(() => {
    const senderIdValue = unref(senderId)
    const recipientIdValue = unref(recipientId)

    return isStringEqualCI(senderIdValue, ownAddress.value) ? recipientIdValue : senderIdValue
  })
}
