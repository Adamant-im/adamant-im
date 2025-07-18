import { toWei, calculateReliableValue, calculateFee } from '@/lib/eth-utils'
import baseGetters from '../eth-base/eth-base-getters'
import { CryptosInfo } from '@/lib/constants'
import { BigNumber } from 'bignumber.js'

const DEFAULT_GAS_PRICE = toWei(CryptosInfo['ETH'].defaultGasPriceGwei, 'gwei')

export default {
  gasPrice(state) {
    return state.gasPrice || DEFAULT_GAS_PRICE
  },

  finalGasPrice: (state) => (increaseFee) => {
    const gasPrice = state.gasPrice || toWei(CryptosInfo['ETH'].defaultGasPriceGwei, 'gwei')
    const cryptoInfo = CryptosInfo['ETH']

    const reliableGasPrice = calculateReliableValue(
      BigNumber(gasPrice).toNumber(),
      cryptoInfo.reliabilityGasPricePercent
    )

    if (increaseFee) {
      const increasedGasPrice = calculateReliableValue(
        reliableGasPrice,
        cryptoInfo.increasedGasPricePercent
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

  privateKey: (state) => state.privateKey,

  web3Account: (state) => state.web3Account,

  ...baseGetters
}
