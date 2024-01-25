import store from '@/store'
import { NavigationGuardNext, RouteLocation } from 'vue-router'

export default (to: RouteLocation, from: RouteLocation, next: NavigationGuardNext) => {
  const isVisibleSymbolsExists = !!store.getters['wallets/getVisibleSymbolsCount']

  if (isVisibleSymbolsExists) {
    next()
  } else {
    next({ name: 'Wallets' })
  }
}
