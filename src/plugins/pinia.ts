import { createPinia } from 'pinia'
import { PiniaSagaPlugin } from '@/pinia/saga'

const pinia = createPinia()
pinia.use(PiniaSagaPlugin())

export { pinia }
