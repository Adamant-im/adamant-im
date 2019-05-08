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
    if (to.params.crypto) {
      if (Cryptos[to.params.crypto.toUpperCase()]) {
        next()
      } else next('/home')
    } else next('/home')
  }
}
