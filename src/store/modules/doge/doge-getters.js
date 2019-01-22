import { TX_FEE } from '../../../lib/doge-api'
import baseGetters from '../btc-base/btc-base-getters'

export default {
  ...baseGetters,

  fee () {
    return TX_FEE
  }
}
