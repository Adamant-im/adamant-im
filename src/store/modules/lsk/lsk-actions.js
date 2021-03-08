import baseActions from '../lsk-base/lsk-base-actions'
import LskApi from '../../../lib/lisk/lisk-api'

const TX_FETCH_INTERVAL = 10 * 1000

const customActions = getApi => ({
  updateStatus (context) {
    const api = getApi()

    if (!api) return
    api.getBalance().then(balance => {
      if (balance) {
        context.commit('status', { balance })
      }
    })

    // // The estimated fee rate is also needed
    // api.getFeeRate().then(rate => context.commit('feeRate', rate))

    // Last block height
    context.dispatch('updateHeight')
  },

  updateHeight ({ commit }) {
    const api = getApi()
    if (!api) return
    api.getHeight().then(height => {
      if (height) {
        commit('height', height)
      }
    })
  },

  /**
   * Updates the transaction details
   * @param {{ dispatch: function, getters: object }} param0 Vuex context
   * @param {{hash: string}} payload action payload
   */
  updateTransaction ({ dispatch, getters }, payload) {
    const tx = getters['transaction'](payload.hash)

    if (tx && (tx.status === 'SUCCESS' || tx.status === 'ERROR')) {
      // If transaction is in one of the final statuses (either succeeded or failed),
      // just update the current height to recalculate its confirmations counter.
      return dispatch('updateHeight')
    } else {
      // Otherwise fetch the transaction details
      return dispatch('getTransaction', payload)
    }
  }
})

// const retrieveNewTransactions = async (api, context, latestTxId, toTx) => {
//   const transactions = await api.getTransactions({ toTx })
//   context.commit('transactions', transactions)

//   if (latestTxId && !transactions.some(x => x.txid === latestTxId)) {
//     const oldest = transactions[transactions.length - 1]
//     await getNewTransactions(api, context, latestTxId, oldest && oldest.txid)
//   }
// }

/**
 * Retrieves new transactions: those that follow the most recently retrieved one.
 * @param {any} context Vuex action context
 * @param {LskApi} api API to retrieve new transactions
 */
const getNewTransactions = async (api, context) => {
  const options = { }
  console.log('getNewTransactions')
  console.log('context.state.maxTimestamp before commit:', context.state.maxTimestamp)
  if (context.state.maxTimestamp > 0) {
    options.fromTimestamp = context.state.maxTimestamp
    options.sort = 'timestamp:asc'
  } else {
    // First time we fetch txs — get newest
    options.sort = 'timestamp:desc'
  }

  context.commit('areRecentLoading', true)
  return api.getTransactions(options).then(
    transactions => {
      context.commit('areRecentLoading', false)
      if (transactions && transactions.length > 0) {
        context.commit('transactions', transactions)
        console.log('context.state.maxTimestamp after commit:', context.state.maxTimestamp)
        // get new transactions until we fetch the newest one
        getNewTransactions(api, context)
      }
    },
    error => {
      context.commit('areRecentLoading', false)
      return Promise.reject(error)
    }
  )
}

const getOldTransactions = async (api, context) => {
  console.log('getOldTransactions')
  // If we already have the most old transaction for this address, no need to request anything
  if (context.state.bottomReached) return Promise.resolve()

  const options = { }
  if (context.state.minTimestamp < Infinity) {
    options.toTimestamp = context.state.minTimestamp
  }
  options.sort = 'timestamp:desc'

  context.commit('areOlderLoading', true)

  return api.getTransactions(options).then(transactions => {
    context.commit('areOlderLoading', false)

    if (transactions && transactions.length > 0) {
      context.commit('transactions', transactions)
    }

    // Successful but empty response means, that the oldest transaction for the current
    // address has been received already
    if (transactions && transactions.length === 0) {
      context.commit('bottom')
    }
  }, error => {
    context.commit('areOlderLoading', false)
    return Promise.reject(error)
  })
}

export default {
  ...baseActions({
    apiCtor: LskApi,
    getOldTransactions,
    getNewTransactions,
    customActions,
    fetchRetryTimeout: TX_FETCH_INTERVAL
  })
}
