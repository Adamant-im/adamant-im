import { estimateFee } from '../../../lib/lisk/lisk-utils'
import baseGetters from '../lsk-base/lsk-base-getters'

export default {
  ...baseGetters,

  fee: (state) => (amount, recipientAddress, data, isNewAccount) => {
    return estimateFee({
      amount,
      data,
      isNewAccount,
      nonce: state.nonce
    })
  },

  height(state) {
    return state.height
  }
}
