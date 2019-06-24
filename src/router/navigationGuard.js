import { Cryptos } from '@/lib/constants'
import validateAddress from '@/lib/validateAddress'
import store from '@/store'

export default {
  chats: (to, from, next) => {
    const chat = store.state.chat.chats[to.params.partnerId]

    // is valid ADM address or is Adamant Chat
    if (
      validateAddress('ADM', to.params.partnerId) ||
      (chat && chat.readOnly)
    ) {
      return next()
    }

    next('/chats')
  },
  transactions: (to, from, next) => {
    const crypto = (to.params.crypto || '').toUpperCase()
    if (crypto in Cryptos) {
      next()
    } else next('/home')
  }
}
