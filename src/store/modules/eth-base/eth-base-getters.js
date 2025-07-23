import { sortTransactionsFn } from '@/store/utils/sortTransactionsFn'
import { CryptosInfo } from '@/lib/constants'
import { calculateReliableValue, calculateFee } from '@/lib/eth-utils'
import { BigNumber } from 'bignumber.js'

export default {
  transaction: (state) => (id) => state.transactions[id],

  /**
   * Returns transactions list sorted by timestamp (from the newest to the oldest)
   * @param {{transactions: Object.<string, object>}} state module state
   * @returns {Array}
   */
  sortedTransactions(state) {
    return Object.values(state.transactions).sort(sortTransactionsFn)
  },

  areTransactionsLoading(state) {
    return state.areTransactionsLoading || state.areRecentLoading || state.areOlderLoading
  },
  areRecentLoading(state) {
    return state.areRecentLoading
  },
  areOlderLoading(state) {
    return state.areOlderLoading
  },
  /**
   * Calculate final gas price with reliability and optional increase
   * @param {Object} state - Vuex state
   * @param {Object} getters - Vuex getters
   * @param {Object} rootState - Vuex root state
   * @param {Object} rootGetters - Vuex root getters
   * @returns {Function} Function that takes increaseFee parameter and returns gas price as string in Wei
   */
  finalGasPrice: (state, getters, rootState, rootGetters) => (increaseFee) => {
    const gasPrice = rootGetters['eth/gasPrice']
    const ethInfo = CryptosInfo['ETH']

    const reliableGasPrice = calculateReliableValue(
      BigNumber(gasPrice).toNumber(),
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
  /**
   * Calculate transaction fee
   * @param {Object} state - Vuex state
   * @param {Object} getters - Vuex getters
   * @returns {Function} Function that calculates fee and returns fee as number in ETH
   */
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
    }
}
