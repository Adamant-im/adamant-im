import Vue from 'vue'

import { resetState } from '../../../lib/reset-state'

export default (initialState) => ({
  /** Resets module state */
  reset (state) {
    resetState(state, initialState())
  },

  address (state, address) {
    state.address = address
  },

  status (state, { balance }) {
    state.balance = balance
    state.lastStatusUpdate = Date.now()
  },

  /** Sets a flag, indicating that the oldest transaction has been retrieved for this account */
  bottom (state) {
    console.log('btc based bottom')
    state.bottomReached = true
  },

  transactions (state, transactions) {
    console.log('transactions btc-based to merge:', transactions.length)
    var added = 0

    transactions.forEach(tx => {
      if (!tx) return

      Object.keys(tx).forEach(key => tx[key] === undefined && delete tx[key])

      const newTx = Object.assign(
        { },
        state.transactions[tx.hash],
        tx
      )

      added += 1
      Vue.set(state.transactions, tx.hash, newTx)
    })
    console.log('transactions btc-based ADDED:', added)
  },

  areOlderLoading (state, areLoading) {
    state.areOlderLoading = areLoading
  },
  areRecentLoading (state, areLoading) {
    state.areRecentLoading = areLoading
  },
  areTransactionsLoading (state, areLoading) {
    state.areTransactionsLoading = areLoading
  }
})
