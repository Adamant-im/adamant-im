import baseGetters from '../eth-base/eth-base-getters'
import { calculateFee } from '../../../lib/eth-utils'
import { CryptosInfo } from '../../../lib/constants'

export default {
  gasPrice(state, getters, rootState, rootGetters) {
    return rootGetters['eth/gasPrice']
  },

  fee:
    (state, getters) =>
    (_amount, _address, _textData, _isNew, increaseFee = false) => {
      const gasPrice = getters.gasPrice
      if (!gasPrice) return 0

      const cryptoInfo = CryptosInfo[state.crypto]
      if (!cryptoInfo) return 0

      const baseGasLimit = cryptoInfo.defaultGasLimit || 58000
      const reliabilityGasLimitPercent = cryptoInfo.reliabilityGasLimitPercent || 10
      const finalGasLimit = baseGasLimit + (baseGasLimit * reliabilityGasLimitPercent) / 100

      const reliabilityGasPricePercent = cryptoInfo.reliabilityGasPricePercent || 10
      let finalGasPrice = gasPrice + (gasPrice * reliabilityGasPricePercent) / 100

      if (increaseFee) {
        const increasedGasPricePercent = cryptoInfo.increasedGasPricePercent || 30
        finalGasPrice = finalGasPrice + (finalGasPrice * increasedGasPricePercent) / 100
      }

      return calculateFee(Math.round(finalGasLimit), Math.round(finalGasPrice))
    },

  ...baseGetters
}
