import baseGetters from '../lsk-base/lsk-base-getters'
import { TX_FEE } from '../../../lib/lisk/lisk-api'

export default {
  ...baseGetters,

  fee: () => TX_FEE,

  height (state) {
    return state.height
  }
}
