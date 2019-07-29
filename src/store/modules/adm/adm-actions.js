import * as admApi from '@/lib/adamant-api'

export default {

  /** Starts background sync after login */
  afterLogin: {
    root: true,
    handler (context) {
      const address = context.rootState.address
      context.commit('address', address)
    }
  },

  /** Resets module state */
  reset: {
    root: true,
    handler (context) {
      context.commit('reset')
    }
  },

  /** Handles store rehydratation */
  rehydrate: {
    root: true,
    handler (context) {
      const address = context.rootState.address
      context.commit('address', address)
    }
  },

  /**
   * Retrieves new transactions: those that follow the most recently retrieved one.
   * @param {any} context Vuex action context
   */
  getNewTransactions (context) {
    const options = { }
    if (context.state.maxHeight > 0) {
      options.from = context.state.maxHeight + 1
    }
    return admApi.getTransactions(options).then(response => {
      if (response.transactions.length > 0) {
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
    if (context.state.minHeight > 1) {
      options.to = context.state.minHeight - 1
    }

    context.commit('areTransactionsLoading', true)
    return admApi.getTransactions(options).then(response => {
      context.commit('areTransactionsLoading', false)
      const hasResult = Array.isArray(response.transactions) && response.transactions.length

      if (hasResult) {
        context.commit('transactions', response.transactions)
      }

      // Successful but empty response means, that the oldest transaction for the current
      // address has been received already
      if (response.success && !hasResult) {
        context.commit('bottom')
      }
    }, error => {
      context.commit('areTransactionsLoading', false)
      return Promise.reject(error)
    })
  },

  /**
   * Retrieves transaction info.
   * @param {any} context Vuex action context
   * @param {string} id transaction ID
   */
  getTransaction (context, { hash }) {
    return admApi.getTransaction(hash).then(
      transaction => context.commit('transactions', [{ ...transaction, status: 'SUCCESS' }])
    )
  },

  /**
   * Sends the specified amount of ADM to the specified ADM address
   * @param {any} context Vuex action context
   * @param {{address: string, amount: number}} options send options
   * @returns {Promise<{nodeTimestamp: number, success: boolean, transactionId: string}>}
   */
  sendTokens (context, options) {
    return admApi.sendTokens(options.address, options.amount).then(result => {
      context.commit('transactions', [{
        id: result.transactionId,
        recipientId: options.address,
        senderId: context.state.address,
        status: 'PENDING'
      }])
      return result
    })
  }
}
