import { createPinia, defineStore, getActivePinia } from 'pinia'
import piniaPluginPersistedState from 'pinia-plugin-persistedstate'

export const pinia = createPinia()
pinia.use(piniaPluginPersistedState)

export function resetPinia() {
  const activePinia = getActivePinia()
  if (activePinia) {
    Object.entries(activePinia.state.value).forEach(([storeName, state]) => {
      const storeDefinition = defineStore(storeName, state)
      const store = storeDefinition(activePinia)
      store.$reset()
      console.info(`[Pinia] The "${storeName}" store has been reset`)
    })
  }
}
