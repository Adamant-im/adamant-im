import baseGetters from '../btc-base/btc-base-getters'
import { TX_FEE } from '../../../lib/bitcoin/dash-api'

export default {
  ...baseGetters,

  fee () {
    return TX_FEE
  }
}
