import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

import { isAdamantChat } from '@/lib/chat/meta/utils'

export function useChatName(address: string) {
  const store = useStore()
  const { t } = useI18n()

  const name = computed(() => store.getters['partners/displayName'](address) || '')

  return isAdamantChat(address) ? t(name.value) : name.value
}
