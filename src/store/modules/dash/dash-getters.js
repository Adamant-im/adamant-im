import baseGetters from '../btc-base/btc-base-getters'
import { Cryptos, CryptosInfo } from '@/lib/constants'

export default {
  ...baseGetters,

  fee: () => (_amount) => CryptosInfo[Cryptos.DASH].fixedFee
}
