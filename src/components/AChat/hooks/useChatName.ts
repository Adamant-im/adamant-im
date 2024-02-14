import { computed, MaybeRef, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

import { isAdamantChat } from '@/lib/chat/meta/utils'

export function useChatName(address: MaybeRef<string>) {
  const store = useStore()
  const { t } = useI18n()

  const chatName = computed(() => {
    const addressValue = unref(address)

    return store.getters['partners/displayName'](addressValue) || ''
  })

  const name = computed(() => {
    return isAdamantChat(address) ? t(chatName.value) : chatName.value
  })

  return name
}
