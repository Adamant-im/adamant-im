import { NavigationGuardNext, RouteLocation } from 'vue-router'
import store from '@/store'

export default (to: RouteLocation, from: RouteLocation, next: NavigationGuardNext) => {
  if (to.name === 'Home' && store.getters['options/wasSendingFunds']) {
    const cryptoCurrency = store.getters['options/savedCryptoCurrency']

    return next({
      name: 'SendFunds',
      params: {
        cryptoCurrency
      }
    })
  }
  next()
}
