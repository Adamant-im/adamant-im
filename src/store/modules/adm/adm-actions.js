import * as admApi from '../../../lib/adamant-api'

export default {
  /**
   * Retrieves new transactions: those that follow the most recently retrieved one.
   * @param {any} context Vuex action context
   */
  getNewTransactions (context) {
    const options = { }
    if (context.state.maxHeight > 0) {
      options.from = context.state.maxHeight
    }

    return admApi.getTransactions(options).then(response => {
      if (Array.isArray(response.transactions) && response.transactions.length) {
        context.commit('transactions', response.transactions)
      }
    })
  },

  /**
   * Retrieves new transactions: those that preceed the oldest among the retrieved ones.
   * @param {any} context Vuex action context
   */
  getOldTransactions (context) {
    // If we already have the most old transaction for this address, no need to request anything
    if (context.state.bottomReached) return Promise.resolve()

    const options = { }
    if (context.state.minHeight > 0) {
      options.to = context.state.minHeight
    }

    return admApi.getTransactions(options).then(response => {
      const hasResult = Array.isArray(response.transactions) && response.transactions.length

      if (hasResult) {
        context.commit('transactions', response.transactions)
      }

      // Successful but empty response means, that the oldest transaction for the current
      // address has been received already
      if (response.success && !hasResult) {
        context.commit('bottom')
      }
    })
  }
}
