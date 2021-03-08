const sortFunc = (a, b) => ((b && b.timestamp) || 0) - ((a && a.timestamp) || 0)

export default {
  transaction: state => id => state.transactions[id],

  /**
   * Returns transactions list sorted by timestamp (from the newest to the oldest)
   * @param {{transactions: Object.<string, object>}} state module state
   * @returns {Array}
   */
  sortedTransactions (state) {
    return Object.values(state.transactions).sort(sortFunc)
  },

  areTransactionsLoading (state) {
    return state.areTransactionsLoading || state.areRecentLoading || state.areOlderLoading
  },
  areRecentLoading (state) {
    return state.areRecentLoading
  },
  areOlderLoading (state) {
    return state.areOlderLoading
  }
}
