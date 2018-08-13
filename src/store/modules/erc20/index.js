import actions from './erc20-actions'
import initialState from './erc20-state'
import getters from './erc20-getters'
import mutations from './erc20-mutations'

export default function erc20Module (crypto, contractAddress, decimals) {
  return {
    state: initialState(crypto, contractAddress, decimals),
    actions,
    getters,
    mutations: mutations(() => initialState(crypto, contractAddress, decimals))
  }
}
