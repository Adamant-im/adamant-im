import baseState from '../btc-base/btc-base-state'
import { Cryptos } from '../../../lib/constants'

export default () => ({
  crypto: Cryptos.BTC,
  ...baseState(),
  utxo: [],
  feeRate: 0,
  height: 0
})
