import baseState from '../kly-base/kly-base-state'
import { Cryptos } from '../../../lib/constants'

export default () => ({
  crypto: Cryptos.KLY,
  ...baseState(),
  feeRate: 0, // not needed
  height: 0
})
