import { estimateFee } from '../../../lib/lisk/lisk-utils'
import baseGetters from '../lsk-base/lsk-base-getters'

export default {
  ...baseGetters,

  fee: () => (amount, _recipientAddress, data, isNewAccount) => {
    return estimateFee({ amount, data, isNewAccount })
  },

  height(state) {
    return state.height
  }
}
