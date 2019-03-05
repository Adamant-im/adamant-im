import { Cryptos } from '@/lib/constants'
import store from '@/store'

export default {
  chats: (to, from, next) => {
    // 1. If come from `$router.push()` then
    //    a. If `IsPartnerInChatList()`, then grant access
    //    b. Else go back to /chats
    // 2. Else watch `state.chat.isFulfilled` until the getChats request is completed
    // 3. Repeat a, b from point 1
    if (store.state.chat.isFulfilled) {
      if (store.state.chat.chats.hasOwnProperty(to.params.partnerId)) {
        next()
      } else next('/chats')
    } else {
      store.watch(state => state.chat.isFulfilled, () => {
        if (store.state.chat.chats.hasOwnProperty(to.params.partnerId)) {
          next()
        } else next('/chats')
      })
    }
  },
  transaction: (to, from, next) => {
    const crypto = to.params.crypto.toUpperCase()
    const txId = to.params.txId
    if (Cryptos[crypto]) {
      if (crypto === 'ADM') {
        if (store.state.adm.transactions.hasOwnProperty(txId)) {
          next()
        } else next('/transactions/ADM')
      } else if (crypto === 'DOGE') {
        if (store.getters['doge/transaction'](txId)) {
          next()
        } else next('/transactions/DOGE')
      } else if (crypto === 'BNB' || crypto === 'BZ') {
        if (store.getters[crypto.toLowerCase() + '/transaction'](txId)) {
          next()
        } else next('/transactions/BNB')
      } else if (crypto === 'ETH') {
        if (store.state.eth.transactions.hasOwnProperty(txId)) {
          next()
        } else next('/transactions/ETH')
      } else next('/home')
    } else next('/home')
  },
  transactions: (to, from, next) => {
    if (to.params.crypto) {
      if (Cryptos[to.params.crypto.toUpperCase()]) {
        next()
      } else next('/home')
    } else next('/home')
  }
}
