import baseGetters from '../eth-base/eth-base-getters'
import { CryptosInfo } from '@/lib/constants'
import { calculateReliableValue, calculateFee } from '@/lib/eth-utils'
import { BigNumber } from 'bignumber.js'

export default {
  gasPrice(state, getters, rootState, rootGetters) {
    return rootGetters['eth/gasPrice']
  },

  finalGasPrice: (state, getters, rootState, rootGetters) => (increaseFee) => {
    const ethGasPrice = rootGetters['eth/gasPrice']
    const ethInfo = CryptosInfo['ETH']

    const reliableGasPrice = calculateReliableValue(
      BigNumber(ethGasPrice).toNumber(),
      ethInfo.reliabilityGasPricePercent
    )

    if (increaseFee) {
      const increasedGasPrice = calculateReliableValue(
        reliableGasPrice,
        ethInfo.increasedGasPricePercent
      )
      return BigNumber(increasedGasPrice).integerValue().toString()
    }

    return BigNumber(reliableGasPrice).integerValue().toString()
  },

  fee:
    (state, getters) =>
    (amount, address, textData, isNewAccount, increaseFee, estimatedGasLimit = null) => {
      const finalGasPrice = getters.finalGasPrice(increaseFee)
      const tokenInfo = CryptosInfo[state.crypto]
      const ethInfo = CryptosInfo['ETH']

      let gasLimit

      if (estimatedGasLimit && amount > 0) {
        gasLimit = calculateReliableValue(estimatedGasLimit, ethInfo.reliabilityGasLimitPercent)
      } else {
        gasLimit = tokenInfo.defaultGasLimit
      }

      return Number(calculateFee(Math.round(gasLimit), finalGasPrice))
    },

  ...baseGetters
}
