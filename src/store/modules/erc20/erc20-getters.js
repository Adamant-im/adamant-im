import baseGetters from '../eth-base/eth-base-getters'
import { DEFAULT_ERC20_TRANSFER_GAS } from '../../../lib/constants'
import { calculateFee } from '../../../lib/eth-utils'

export default {
  gasPrice(state, getters, rootState, rootGetters) {
    return rootGetters['eth/gasPrice']
  },

  fee: (state, getters) => (amount) => calculateFee(DEFAULT_ERC20_TRANSFER_GAS, getters.gasPrice),

  ...baseGetters
}
