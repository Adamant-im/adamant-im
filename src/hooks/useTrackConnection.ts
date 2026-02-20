import { onBeforeUnmount, watch } from 'vue'
import { i18n } from '@/i18n'
import { useConsiderOffline } from '@/hooks/useConsiderOffline'
import { useStore } from 'vuex'
import { startConnectionQualityMonitoring } from '@/lib/network/connection'

export function useTrackConnection() {
  const store = useStore()
  const { consideredOffline } = useConsiderOffline()
  const stopConnectionQualityMonitoring = startConnectionQualityMonitoring()

  let firstCallSkipped = false

  watch(consideredOffline, (isOffline) => {
    if (!firstCallSkipped) {
      firstCallSkipped = true
      return
    }

    const type = isOffline ? 'offline' : 'online'

    store.dispatch('snackbar/show', {
      message: i18n.global.t(`connection.${type}`),
      timeout: 3000
    })
  })

  onBeforeUnmount(() => {
    stopConnectionQualityMonitoring()
  })
}
