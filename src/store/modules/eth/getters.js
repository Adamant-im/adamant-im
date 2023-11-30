import { toWei } from '@/lib/eth-utils'
import baseGetters from '../eth-base/eth-base-getters'
import { CryptosInfo } from '@/lib/constants'

const DEFAULT_GAS_PRICE = toWei(CryptosInfo['ETH'].defaultGasPriceGwei, 'gwei')

export default {
  gasPrice(state) {
    return state.gasPrice || DEFAULT_GAS_PRICE
  },

  fee: (state) => (_amount) => state.fee,

  privateKey: (state) => state.privateKey,

  web3Account: (state) => state.web3Account,

  ...baseGetters
}
