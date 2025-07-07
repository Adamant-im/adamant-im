import baseGetters from '../eth-base/eth-base-getters'
import { CryptosInfo } from '@/lib/constants'
import { calculateReliableValue, calculateFee } from '@/lib/eth-utils'

export default {
  gasPrice(state, getters, rootState, rootGetters) {
    return rootGetters['eth/gasPrice']
  },

  finalGasPrice: (state, getters, rootState, rootGetters) => (increaseFee) => {
    const ethGasPrice = rootGetters['eth/gasPrice']
    const tokenInfo = CryptosInfo[state.crypto]

    const reliableGasPrice = Number(ethGasPrice) * (1 + tokenInfo.reliabilityGasPricePercent / 100)

    if (increaseFee) {
      return reliableGasPrice * (1 + tokenInfo.increasedGasPricePercent / 100)
    }

    return reliableGasPrice
  },

  fee: (state, getters) => (amount, address, textData, isNewAccount, increaseFee) => {
    const finalGasPrice = getters.finalGasPrice(increaseFee)
    const reliableGasLimit = calculateReliableValue(
      CryptosInfo[state.crypto].defaultGasLimit,
      CryptosInfo[state.crypto].reliabilityGasLimitPercent
    )

    return Number(calculateFee(Math.round(reliableGasLimit), Math.round(finalGasPrice)))
  },

  ...baseGetters
}
