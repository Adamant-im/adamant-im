import { estimateFee } from '../../../lib/klayr/klayr-utils'
import baseGetters from '../kly-base/kly-base-getters'

export default {
  ...baseGetters,

  fee: (state) => (amount, recipientAddress, data, isNewAccount) => {
    try {
      return estimateFee({
        amount,
        data,
        isNewAccount,
        nonce: state.nonce
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return 0
    }
  },

  height(state) {
    return state.height
  }
}
