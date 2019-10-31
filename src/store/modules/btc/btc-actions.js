import baseActions from '../btc-base/btc-base-actions'
import BtcApi from '../../../lib/bitcoin/bitcoin-api'

export default {
  ...baseActions({
    apiCtor: BtcApi,
    getOldTransactions: null,
    getNewTransactions: null
  })
}
