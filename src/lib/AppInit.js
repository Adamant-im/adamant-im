import store from '@/store'
import router from '@/router'
import AppInterval from '@/lib/AppInterval'
import { restoreState } from '@/lib/idb/state'
import { clearDb } from '@/lib/idb'

/**
 * Handle App initialization after F5.
 *
 * 1. Login via password
 *  - restoreState
 *  - loadChats
 *  - AppInterval.subscribe
 *
 * 2. Login via passphrase
 *  - loadChats
 *  - AppInterval.subscribe
 */
export default () => {
  if (store.getters['options/isLoginViaPassword']) {
    if (store.state.password) {
      restoreState(store)
        .then(() => {
          store.commit('setIDBReady', true)
        })
        .then(() => {
          if (!store.state.chat.isFulfilled) {
            store.commit('chat/createAdamantChats')
            return store.dispatch('chat/loadChats')
          }
        })
        .then(() => {
          AppInterval.subscribe()
        })
        .catch(() => {
          console.error('Can not decode IDB with current password. Fallback to Login via Passphrase.')

          clearDb()
            .then(() => {
              store.commit('options/updateOption', {
                key: 'logoutOnTabClose',
                value: true
              })
              store.commit('reset')
            })
            .catch(err => {
              console.error(err)
            })
            .finally(() => {
              router.push('/')
            })
        })
    }
  } else if (store.getters.isLogged) { // is logged with passphrase
    store.commit('chat/createAdamantChats')
    store.dispatch('chat/loadChats')
      .then(() => AppInterval.subscribe())

    store.dispatch('afterLogin', store.state.passphrase)
  }
}
