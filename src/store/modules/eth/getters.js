import { toWei } from '@/lib/eth-utils'
import baseGetters from '../eth-base/eth-base-getters'
import { CryptosInfo } from '@/lib/constants'
import * as utils from '@/lib/eth-utils'

const DEFAULT_GAS_PRICE = toWei(CryptosInfo['ETH'].defaultGasPriceGwei, 'gwei')

export default {
  gasPrice(state) {
    return state.gasPrice || DEFAULT_GAS_PRICE
  },

  fee: (state) => (amount, address, textData, isNewAccount, increaseFee) => {
    const gasPrice = state.gasPrice || toWei(CryptosInfo['ETH'].defaultGasPriceGwei, 'gwei')

    const gasLimit = CryptosInfo['ETH'].defaultGasLimit

    const cryptoInfo = CryptosInfo['ETH']
    const finalGasLimit = gasLimit + (gasLimit * cryptoInfo.reliabilityGasLimitPercent) / 100
    let finalGasPrice =
      Number(gasPrice) + (Number(gasPrice) * cryptoInfo.reliabilityGasPricePercent) / 100

    if (increaseFee) {
      finalGasPrice = finalGasPrice + (finalGasPrice * cryptoInfo.increasedGasPricePercent) / 100
    }

    return Number(utils.calculateFee(Math.round(finalGasLimit), Math.round(finalGasPrice)))
  },

  privateKey: (state) => state.privateKey,

  web3Account: (state) => state.web3Account,

  ...baseGetters
}
