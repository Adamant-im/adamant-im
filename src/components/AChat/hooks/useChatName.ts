import { computed, MaybeRef, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

import { isAdamantChat } from '@/lib/chat/meta/utils'

/**
 * Returns the chat name of the partner.
 * If no name is assigned, returns an empty string.
 *
 * @param address - The address of the partner.
 * @param fallbackToAddress - If true, fallback to address if no name was assigned.
 */
export function useChatName(address: MaybeRef<string>, fallbackToAddress = false) {
  const store = useStore()
  const { t } = useI18n()

  const chatName = computed(() => {
    const addressValue = unref(address)

    return store.getters['partners/displayName'](addressValue) || ''
  })

  const name = computed(() => {
    const addressValue = unref(address)

    if (isAdamantChat(addressValue)) {
      return t(chatName.value)
    }

    if (fallbackToAddress) {
      return chatName.value || addressValue
    }

    return chatName.value
  })

  return name
}
