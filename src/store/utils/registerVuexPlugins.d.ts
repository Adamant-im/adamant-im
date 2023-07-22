import { Plugin, Store } from 'vuex'

/**
 * Register Vuex plugins dynamically
 * @param store Vuex store instance
 * @param plugins List of plugins for registration
 */
export function registerVuexPlugins(store: Store<unknown>, plugins: Plugin[]): void
