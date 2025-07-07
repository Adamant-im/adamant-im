import { toWei, calculateReliableValue, calculateFee } from '@/lib/eth-utils'
import baseGetters from '../eth-base/eth-base-getters'
import { CryptosInfo } from '@/lib/constants'

const DEFAULT_GAS_PRICE = toWei(CryptosInfo['ETH'].defaultGasPriceGwei, 'gwei')

export default {
  gasPrice(state) {
    return state.gasPrice || DEFAULT_GAS_PRICE
  },

  finalGasPrice: (state) => (increaseFee) => {
    const gasPrice = state.gasPrice || toWei(CryptosInfo['ETH'].defaultGasPriceGwei, 'gwei')
    const cryptoInfo = CryptosInfo['ETH']

    const reliableGasPrice = Number(gasPrice) * (1 + cryptoInfo.reliabilityGasPricePercent / 100)

    if (increaseFee) {
      return reliableGasPrice * (1 + cryptoInfo.increasedGasPricePercent / 100)
    }

    return reliableGasPrice
  },

  fee: (state, getters) => (amount, address, textData, isNewAccount, increaseFee) => {
    const finalGasPrice = getters.finalGasPrice(increaseFee)
    const reliableGasLimit = calculateReliableValue(
      CryptosInfo['ETH'].defaultGasLimit,
      CryptosInfo['ETH'].reliabilityGasLimitPercent
    )

    return Number(calculateFee(Math.round(reliableGasLimit), Math.round(finalGasPrice)))
  },

  privateKey: (state) => state.privateKey,

  web3Account: (state) => state.web3Account,

  ...baseGetters
}
