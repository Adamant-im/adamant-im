import baseGetters from '../eth-base/eth-base-getters'
import { ERC20_TRANSFER_GAS } from '../../../lib/constants'
import { calculateFee } from '../../../lib/eth-utils'

export default {
  gasPrice (state, getters, rootState, rootGetters) {
    return rootGetters['eth/gasPrice']
  },

  fee (state, getters) {
    return calculateFee(ERC20_TRANSFER_GAS, getters.gasPrice)
  },

  ...baseGetters
}
