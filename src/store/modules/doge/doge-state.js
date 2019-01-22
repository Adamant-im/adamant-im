import baseState from '../btc-base/btc-base-state'
import { Cryptos } from '../../../lib/constants'

export default () => ({
  crypto: Cryptos.DOGE,
  ...baseState()
})
