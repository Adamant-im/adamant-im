const sortFunc = (a, b) => ((b && b.timestamp) || 0) - ((a && a.timestamp) || 0)

export default {
  /**
   * Returnes transactions list sorted by timestamp (from the newest to the oldest)
   * @param {{transactions: Object.<string, object>}} state module state
   * @returns {Array}
   */
  sortedTransactions (state) {
    return Object.values(state.transactions).sort(sortFunc)
  },

  /**
   * Returns transactions with the specified partner.
   * This getter was added to support transactions display in chats and supposed to be removed
   * as soon as we add an endpoint to fetch transactions for chats.
   */
  partnerTransactions: state => partner => Object.values(state.transactions).filter(tx => tx.partner === partner)
}
