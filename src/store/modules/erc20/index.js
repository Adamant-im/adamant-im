import actions from './erc20-actions'
import initialState from './erc20-state'
import getters from './erc20-getters'
import mutations from './erc20-mutations'

/**
 * Creates new ERC20 module.
 * @param {String} crypto crypto name
 * @param {*} contractAddress ERC20 contract address
 * @param {*} decimals number of decimals for the amounts
 */
export default function erc20Module (crypto, contractAddress, decimals) {
  return {
    namespaced: true,
    state: initialState(crypto, contractAddress, decimals),
    actions,
    getters,
    mutations: mutations(() => initialState(crypto, contractAddress, decimals))
  }
}
