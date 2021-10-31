import baseState from '../lsk-base/lsk-base-state'
import { Cryptos } from '../../../lib/constants'

export default () => ({
  crypto: Cryptos.LSK,
  ...baseState(),
  feeRate: 0, // not needed
  height: 0
})
