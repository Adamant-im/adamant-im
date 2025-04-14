import { isAdamantChat } from '@/lib/chat/meta/utils'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

export const usePartnerName = () => {
  const store = useStore()
  const { t } = useI18n()

  const getPartnerName = (address: string) => {
    const name = store.getters['partners/displayName'](address) || ''

    return isAdamantChat(address) ? t(name) : name
  }

  return {
    getPartnerName
  }
}
