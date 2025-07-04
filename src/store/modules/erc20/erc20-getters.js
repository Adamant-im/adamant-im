import baseGetters from '../eth-base/eth-base-getters'
import { CryptosInfo } from '@/lib/constants'
import * as ethUtils from '../../../lib/eth-utils'

export default {
  gasPrice(state, getters, rootState, rootGetters) {
    return rootGetters['eth/gasPrice']
  },

  fee:
    (state, getters, rootState, rootGetters) =>
    (amount, address, textData, isNewAccount, increaseFee) => {
      const ethGasPrice = rootGetters['eth/gasPrice']

      const tokenInfo = CryptosInfo[state.crypto]
      const gasLimit = tokenInfo.defaultGasLimit

      const finalGasLimit = gasLimit + (gasLimit * tokenInfo.reliabilityGasLimitPercent) / 100
      let finalGasPrice =
        Number(ethGasPrice) + (Number(ethGasPrice) * tokenInfo.reliabilityGasPricePercent) / 100

      if (increaseFee) {
        finalGasPrice = finalGasPrice + (finalGasPrice * tokenInfo.increasedGasPricePercent) / 100
      }

      return Number(ethUtils.calculateFee(Math.round(finalGasLimit), Math.round(finalGasPrice)))
    },

  ...baseGetters
}
