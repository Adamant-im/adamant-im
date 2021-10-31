import baseActions from '../lsk-base/lsk-base-actions'
import LskApi from '../../../lib/lisk/lisk-api'

const TX_FETCH_INTERVAL = 10 * 1000

const customActions = getApi => ({
  updateStatus (context) {
    const api = getApi()

    if (!api) return
    api.getAccount().then(account => {
      if (account) {
        context.commit('status', { balance: account.balance, nonce: account.nonce })
      }
    })

    // Not needed
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

export default {
  ...baseActions({
    apiCtor: LskApi,
    customActions,
    fetchRetryTimeout: TX_FETCH_INTERVAL
  })
}
