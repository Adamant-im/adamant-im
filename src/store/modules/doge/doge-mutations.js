import Vue from 'vue'

import { resetState } from '../../../lib/reset-state'
import initialState from './doge-state'

export default {
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
    state.bottomReached = true
  },

  transactions (state, transactions) {
    transactions.forEach(tx => {
      if (!tx) return

      Object.keys(tx).forEach(key => tx[key] === undefined && delete tx[key])

      const newTx = Object.assign(
        { },
        state.transactions[tx.hash],
        tx
      )

      Vue.set(state.transactions, tx.hash, newTx)
    })
  }
}
