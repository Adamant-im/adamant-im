import baseGetters from '../btc-base/btc-base-getters'
import { Cryptos, CryptosInfo } from '@/lib/constants'

export default {
  ...baseGetters,

  fee: state => amount => CryptosInfo[Cryptos.DASH].fixedFee
}
