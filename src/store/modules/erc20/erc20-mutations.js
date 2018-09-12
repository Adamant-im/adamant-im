import Vue from 'vue'

import { resetState } from '../../../lib/reset-state'

export default getInitialState => ({
  /** Resets module state */
  reset (state) {
    resetState(state, getInitialState())
  },

  /** Set balance */
  balance (state, balance) {
    state.balance = balance
  },

  /** Set account */
  account (state, account) {
    state.address = account.address
    state.publicKey = account.publicKey
    state.privateKey = account.privateKey
  },

  /** Adds a new transaction */
  transaction (state, tx) {
    const newTx = Object.assign({ }, state.transactions[tx.hash], tx)
    Vue.set(state.transactions, tx.hash, newTx)
  }
})
