import { estimateFee } from '../../../lib/klayr/klayr-utils'
import baseGetters from '../kly-base/kly-base-getters'

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
