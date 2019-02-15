import { Cryptos } from '@/lib/constants'
import store from '@/store'

export default {
  chats: (to, from, next) => {
    if (store.state.partners.list.hasOwnProperty(to.params.partnerId)) {
      next()
    } else next('/chats')
  },
  transaction: (to, from, next) => {
    const crypto = to.params.crypto.toUpperCase()
    const txId = to.params.txId
    console.log(crypto, txId)
    if (Cryptos[crypto]) {
      if (crypto === 'ADM') {
        console.dir(store.state.adm.transactions.hasOwnProperty(txId), store.state.adm.transactions)
        if (store.state.adm.transactions.hasOwnProperty(txId)) {
          next()
        } else next('/transactions/ADM')
      } else if (crypto === 'DOGE') {
        console.dir(store.getters['doge/transaction'](txId))
        if (store.getters['doge/transaction'](txId)) {
          next()
        } else next('/transactions/DOGE')
      } else if (crypto === 'BNB' || crypto === 'BZ') {
        console.dir(store.getters[crypto.toLowerCase() + '/transaction'](txId))
        if (store.getters[crypto.toLowerCase() + '/transaction'](txId)) {
          next()
        } else next('/transactions/BNB')
      } else if (crypto === 'ETH') {
        console.dir(store.state.eth.transactions.hasOwnProperty(txId), store.state.eth.transactions)
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
