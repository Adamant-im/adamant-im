import { watch } from 'vue'
import { i18n } from '@/i18n'
import { useConsiderOffline } from '@/hooks/useConsiderOffline'
import { useStore } from 'vuex'

export function useTrackConnection() {
  const store = useStore()
  const { consideredOffline } = useConsiderOffline()

  watch(consideredOffline, (isOffline) => {
    const type = isOffline ? 'offline' : 'online'

    store.dispatch('snackbar/show', {
      message: i18n.global.t(`connection.${type}`),
      timeout: 3000
    })
  })
}
