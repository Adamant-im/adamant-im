import Vue from 'vue'

export default {

  /** Set ETH balance */
  balance (state, balance) {
    state.balance = balance
  },

  /** Set ETH account */
  account (state, account) {
    state.address = account.address
    state.publicKey = account.publicKey
    state.privateKey = account.privateKey
  },

  /** Adds a new transaction */
  addTransaction (state, tx) {
    state.transactions.push(tx)
  },

  /** Completes the pending transaction */
  completeTransaction (state, payload) {
    const index = state.transactions.findIndex(x => x.hash === payload.hash)
    if (index >= 0) {
      const tx = state.transactions[index]
      const status = payload.success ? 'SUCCESS' : 'FAILED'
      Vue.set(state.transactions, index, { ...tx, status })
    }
  }
}
