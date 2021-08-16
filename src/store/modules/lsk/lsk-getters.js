import baseGetters from '../lsk-base/lsk-base-getters'
import { TX_FEE } from '../../../lib/lisk/lisk-api'

export default {
  ...baseGetters,

  // fee (state) {
  //   // return state.fee
  //   return 0.1
  // },
  fee: state => amount => TX_FEE,

  height (state) {
    return state.height
  }
}
