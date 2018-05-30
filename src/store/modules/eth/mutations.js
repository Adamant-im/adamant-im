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

  transactionConfirmation (state, payload) {
    const index = state.transactions.findIndex(x => x.hash === payload.hash)
    if (index < 0) return

    const tx = state.transactions[index]
    Vue.set(state.transactions, index, {
      ...tx,
      confirmations: payload.number,
      status: payload.receipt.status ? 'SUCCESS' : 'ERROR'
    })
  },

  transactionError (state, hash) {
    const index = state.transactions.findIndex(x => x.hash === hash)
    if (index < 0) return

    const tx = state.transactions[index]
    Vue.set(state.transactions, index, {
      ...tx,
      status: 'ERROR'
    })
  }
}
