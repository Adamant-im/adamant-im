import baseState from '../lsk-base/lsk-base-state'
import { Cryptos } from '../../../lib/constants'

export default () => ({
  crypto: Cryptos.LSK,
  ...baseState(),
  utxo: [],
  feeRate: 0,
  height: 0
})
