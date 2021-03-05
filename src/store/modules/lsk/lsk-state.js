import baseState from '../lsk-base/lsk-base-state'
import { Cryptos } from '../../../lib/constants'
import { TX_FEE } from '../../../lib/lisk/lisk-api'

export default () => ({
  crypto: Cryptos.LSK,
  ...baseState(),
  // utxo: [],
  feeRate: TX_FEE,
  height: 0
})
