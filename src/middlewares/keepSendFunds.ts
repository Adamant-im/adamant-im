import { NavigationGuardNext, RouteLocation } from 'vue-router'
import store from '@/store'

export default (to: RouteLocation, from: RouteLocation, next: NavigationGuardNext) => {
  if (to.name === 'Home' && from.name !== 'SendFunds' && store.state.options.wasSendingFunds) {
    return next({
      name: 'SendFunds',
      params: { cryptoCurrency: store.state.options.currentWallet }
    })
  }
  next()
}
