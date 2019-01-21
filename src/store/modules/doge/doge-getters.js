import { TX_FEE } from '../../../lib/doge-api'

const sortFunc = (a, b) => ((b && b.timestamp) || 0) - ((a && a.timestamp) || 0)

export default {
  transaction: state => id => state.transactions[id],

  fee () {
    return TX_FEE
  },

  /**
   * Returns transactions list sorted by timestamp (from the newest to the oldest)
   * @param {{transactions: Object.<string, object>}} state module state
   * @returns {Array}
   */
  sortedTransactions (state) {
    return Object.values(state.transactions).sort(sortFunc)
  }
}
