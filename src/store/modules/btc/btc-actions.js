import baseActions from '../btc-base/btc-base-actions'
import BtcApi from '../../../lib/bitcoin/bitcoin-api'

const TX_CHUNK_SIZE = 25
const TX_FETCH_INTERVAL = 60 * 1000

const customActions = getApi => ({
  updateStatus (context) {
    const api = getApi()

    if (!api) return
    api.getBalance().then(balance => context.commit('status', { balance }))

    // The unspent transactions are needed to estimate the fee
    api.getUnspents().then(utxo => context.commit('utxo', utxo))

    // The estimated fee rate is also needed
    api.getFeeRate().then(rate => context.commit('feeRate', rate))

    // Last block height
    context.dispatch('updateHeight')
  },

  updateHeight ({ commit }) {
    const api = getApi()
    if (!api) return
    api.getHeight().then(height => commit('height', height))
  },

  /**
   * Updates the transaction details
   * @param {{ dispatch: function, getters: object }} param0 Vuex context
   * @param {{hash: string}} payload action payload
   */
  updateTransaction ({ dispatch, getters }, payload) {
    const tx = getters.transaction(payload.hash)

    if (tx && (tx.status === 'CONFIRMED' || tx.status === 'REJECTED')) {
      // If transaction is in one of the final statuses (either succeeded or failed),
      // just update the current height to recalculate its confirmations counter.
      return dispatch('updateHeight')
    } else {
      // Otherwise fetch the transaction details
      return dispatch('getTransaction', { ...payload, force: payload.force, updateOnly: payload.updateOnly })
    }
  }
})

const retrieveNewTransactions = async (api, context, latestTxId, toTx) => {
  const transactions = await api.getTransactions({ toTx })
  context.commit('transactions', transactions)

  if (latestTxId && !transactions.some(x => x.txid === latestTxId)) {
    const oldest = transactions[transactions.length - 1]
    await getNewTransactions(api, context, latestTxId, oldest && oldest.txid)
  }
}

const getNewTransactions = async (api, context) => {
  context.commit('areRecentLoading', true)
  // Determine the most recent transaction ID
  const latestTransaction = context.getters.sortedTransactions[0]
  const latestId = latestTransaction && latestTransaction.txid
  // Now fetch the transactions until we meet that latestId among the
  // retrieved results
  await retrieveNewTransactions(api, context, latestId)
  context.commit('areRecentLoading', false)
}

const getOldTransactions = async (api, context) => {
  // If we already have the most old transaction for this address, no need to request anything
  if (context.state.bottomReached) return Promise.resolve()

  const transactions = context.getters.sortedTransactions
  const oldestTx = transactions[transactions.length - 1]
  const toTx = oldestTx && oldestTx.txid

  context.commit('areOlderLoading', true)
  const chunk = await api.getTransactions({ toTx })
  context.commit('transactions', chunk)
  context.commit('areOlderLoading', false)

  if (chunk.length < TX_CHUNK_SIZE) {
    context.commit('bottom', true)
  }
}

export default {
  ...baseActions({
    apiCtor: BtcApi,
    getOldTransactions,
    getNewTransactions,
    customActions,
    fetchRetryTimeout: TX_FETCH_INTERVAL
  })
}
