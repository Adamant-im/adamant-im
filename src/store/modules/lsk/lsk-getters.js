import { estimateFee } from '../../../lib/lisk/lisk-utils'
import baseGetters from '../lsk-base/lsk-base-getters'

export default {
  ...baseGetters,

  fee: () => (_amount, _recipientAddress, _data) => {
    return estimateFee()
  },

  height(state) {
    return state.height
  }
}
