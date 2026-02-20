import { createPinia, defineStore, getActivePinia } from 'pinia'
import { logger } from '@/utils/devTools/logger'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

export function resetPinia() {
  const activePinia = getActivePinia()
  if (activePinia) {
    Object.entries(activePinia.state.value).forEach(([storeName, state]) => {
      const storeDefinition = defineStore(storeName, state)
      const store = storeDefinition(activePinia)
      store.$reset()
      logger.log('pinia', 'info', `The "${storeName}" store has been reset`)
    })
  }
}
