import store from '@/store'
import { RouteLocationNormalized } from 'vue-router'

export default (_to: RouteLocationNormalized, _from: RouteLocationNormalized) => {
  const isVisibleSymbolsExists = !!store.getters['wallets/getVisibleSymbolsCount']

  if (isVisibleSymbolsExists) {
    return true
  }

  return { name: 'Wallets' }
}
