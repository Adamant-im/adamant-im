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
    console.log('bottom lsk set')
    state.bottomReached = true
  },

  /**
   * Adds new transactions
   * @param {{transactions: object, minTimestamp: number, maxTimestamp: number}} state current state
   * @param {Array<{hash: string, time: number}>} transactions transactions list
   */
  transactions (state, transactions) {
    if (transactions.updateTimestamps) {
      var updateTimestamps = transactions.updateTimestamps
      transactions = transactions.transactions
    }

    let minTimestamp = Infinity
    let maxTimestamp = -1

    console.log('transactions lsk to merge:', transactions.length)

    transactions.forEach(tx => {
      if (!tx) return

      Object.keys(tx).forEach(key => tx[key] === undefined && delete tx[key])

      const newTx = Object.assign(
        { },
        state.transactions[tx.hash],
        tx
      )

      Vue.set(state.transactions, tx.hash, newTx)

      if (tx.timestamp && updateTimestamps) {
        minTimestamp = Math.min(minTimestamp, tx.timestamp)
        maxTimestamp = Math.max(maxTimestamp, tx.timestamp)
      }
    })

    if (minTimestamp < state.minTimestamp) {
      state.minTimestamp = minTimestamp
      console.log('set minTimestamp:', minTimestamp)
    }

    if (maxTimestamp > state.maxTimestamp) {
      state.maxTimestamp = maxTimestamp
      console.log('set maxTimestamp:', maxTimestamp)
    }
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
