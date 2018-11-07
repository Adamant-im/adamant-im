const DEFAULT_GAS_PRICE = '20000000000' // 20 Gwei
const sortFunc = (a, b) => ((b && b.timestamp) || 0) - ((a && a.timestamp) || 0)

export default {
  gasPrice (state) {
    return state.gasPrice || DEFAULT_GAS_PRICE
  },

  fee (state) {
    return state.fee
  },

  transaction: state => id => state.transactions[id],

  privateKey: state => state.privateKey,

  /**
   * Returnes transactions list sorted by timestamp (from the newest to the oldest)
   * @param {{transactions: Object.<string, object>}} state module state
   * @returns {Array}
   */
  sortedTransactions (state) {
    return Object.values(state.transactions).sort(sortFunc)
  }
}
