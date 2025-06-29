import { watch } from 'vue'
import { i18n } from '@/i18n'
import { useConsiderOffline } from '@/hooks/useConsiderOffline'
import { useStore } from 'vuex'

export function useTrackConnection() {
  const store = useStore()
  const { consideredOffline } = useConsiderOffline()

  // To ignore the first switch from false to true while connecting to nodes (e.g. page reload)
  let firstCallIgnored = false

  watch(consideredOffline, (isOffline) => {
    if (!firstCallIgnored) {
      firstCallIgnored = true
      return
    }

    const type = isOffline ? 'offline' : 'online'

    store.dispatch('snackbar/show', {
      message: i18n.global.t(`connection.${type}`),
      timeout: 3000
    })
  })
}
