import * as admApi from '@/lib/adamant-api'
import adm from '../../../lib/nodes/adm'

export default {
  /** Starts background sync after login */
  afterLogin: {
    root: true,
    handler(context) {
      const address = context.rootState.address
      context.commit('address', address)
    }
  },

  /** Resets module state */
  reset: {
    root: true,
    handler(context) {
      context.commit('reset')
    }
  },

  /** Handles store rehydratation */
  rehydrate: {
    root: true,
    handler(context) {
      const address = context.rootState.address
      context.commit('address', address)
    }
  },

  /**
   * Retrieves new transactions: those that follow the most recently retrieved one.
   * @param {any} context Vuex action context
   */
  getNewTransactions(context) {
    const options = {}
    options.minAmount = 1
    // Magic here helps to refresh Tx list when browser deletes it
    if (Object.keys(context.state.transactions).length < context.state.transactionsCount) {
      context.state.transactionsCount = 0
      context.state.maxHeight = -1
      context.state.minHeight = Infinity
      context.commit('bottom', false)
    }
    if (context.state.maxHeight > 0) {
      options.fromHeight = context.state.maxHeight + 1
      options.orderBy = 'timestamp:asc'
    } else {
      // First time we fetch txs — get newest
      options.orderBy = 'timestamp:desc'
    }

    context.commit('areRecentLoading', true)
    return admApi.getTransactions(options).then(
      (response) => {
        context.commit('areRecentLoading', false)
        if (response.transactions.length > 0) {
          context.commit('transactions', {
            transactions: response.transactions,
            updateTimestamps: true
          })
          // get new transactions until we fetch the newest one
          if (options.fromHeight && response.transactions.length === admApi.TX_CHUNK_SIZE) {
            this.dispatch('adm/getNewTransactions')
          }
        }
      },
      (error) => {
        context.commit('areRecentLoading', false)
        return Promise.reject(error)
      }
    )
  },

  /**
   * Retrieves old transactions: those that preceded the oldest among the retrieved ones.
   * @param {any} context Vuex action context
   */
  getOldTransactions(context) {
    // If we already have the most old transaction for this address, no need to request anything
    if (context.state.bottomReached) return Promise.resolve()

    const options = {}
    options.minAmount = 1
    if (context.state.minHeight < Infinity) {
      options.toHeight = context.state.minHeight - 1
    }
    options.orderBy = 'timestamp:desc'

    context.commit('areOlderLoading', true)
    return admApi.getTransactions(options).then(
      (response) => {
        context.commit('areOlderLoading', false)
        const hasResult = Array.isArray(response.transactions) && response.transactions.length
        if (hasResult) {
          context.commit('transactions', {
            transactions: response.transactions,
            updateTimestamps: true
          })
        }
        // Successful but empty response means, that the oldest transaction for the current
        // address has been received already
        if (response.success && !hasResult) {
          context.commit('bottom', true)
        }
      },
      (error) => {
        context.commit('areOlderLoading', false)
        return Promise.reject(error)
      }
    )
  },

  /**
   * Retrieves transaction info.
   * @param {any} context Vuex action context
   * @param {string} id transaction ID
   */
  getTransaction(context, { hash }) {
    return admApi.getTransaction(hash).then((transaction) => {
      context.commit('transactions', [transaction])
    })
  },

  /**
   * Updates the transaction details
   * @param {{ dispatch: function }} param0 Vuex context
   * @param {{hash: string}} payload action payload
   */
  updateTransaction({ dispatch }, payload) {
    return dispatch('getTransaction', payload)
  },

  /**
   * Sends the specified amount of ADM to the specified ADM address
   * @param {any} context Vuex action context
   * @param {{address: string, amount: number}} options send options
   * @returns {Promise<{nodeTimestamp: number, success: boolean, transactionId: string}>}
   */
  async sendTokens(context, options) {
    await adm.assertAnyNodeOnline()

    const result = await admApi.sendTokens(options.address, options.amount)

    context.commit('transactions', [
      {
        id: result.transactionId,
        recipientId: options.address,
        senderId: context.state.address,
        status: 'PENDING'
      }
    ])

    return result
  }
}
