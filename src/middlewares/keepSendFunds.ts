import { RouteLocationNormalized } from 'vue-router'
import store from '@/store'

export default (to: RouteLocationNormalized, _from: RouteLocationNormalized) => {
  if (to.name === 'Home' && store.getters['options/wasSendingFunds']) {
    const cryptoCurrency = store.getters['options/savedCryptoCurrency']

    return {
      name: 'SendFunds',
      params: {
        cryptoCurrency
      }
    }
  }

  return true
}
