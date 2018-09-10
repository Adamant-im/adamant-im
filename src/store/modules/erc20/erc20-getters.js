import { ETH_TRANSFER_GAS } from '../../../lib/constants'
import { toEther } from '../../../lib/eth-utils'

export default {
  gasPrice (state, getters, rootState, rootGetters) {
    return rootGetters['eth/gasPrice'] * 3
  },

  fee (state, getters) {
    const wei = getters.gasPrice * Number(ETH_TRANSFER_GAS)
    return toEther(wei)
  },

  transaction: state => id => state.transactions[id]
}
