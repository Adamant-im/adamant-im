import { App } from 'vue'
import { Store } from 'vuex'

declare global {
  interface Window {
    ep: App<Element>
    store: Store<any>
  }
}
