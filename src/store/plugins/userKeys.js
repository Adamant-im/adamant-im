import { getCurrentAccount } from '@/lib/adamant-api'

export default (store) => {
  store.subscribe((mutation) => {
    const { type, payload } = mutation
    if (type === 'chat/setFulfilled' && payload) {
      getCurrentAccount().then((account) => {
        const pk = account.privateKey
        store.commit('setMyPK', pk)
      })
    }
  })
}
