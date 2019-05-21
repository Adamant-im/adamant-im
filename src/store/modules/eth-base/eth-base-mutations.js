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

  /** Sets a flag, indicating that the oldest transaction has been retrieved for this account */
  bottom (state) {
    state.bottomReached = true
  },

  /**
   * Adds new transactions
   * @param {{transactions: object, minHeight: number, maxHeight: number}} state current state
   * @param {Array<{hash: string, time: number}>} transactions transactions list
   */
  transactions (state, transactions) {
    let minHeight = Infinity
    let maxHeight = 0

    const address = state.address

    transactions.forEach(tx => {
      if (!tx) return

      Object.keys(tx).forEach(key => tx[key] === undefined && delete tx[key])

      const direction = tx.recipientId === address ? 'to' : 'from'
      const newTx = Object.assign(
        { direction, id: tx.hash },
        state.transactions[tx.hash],
        tx
      )

      Vue.set(state.transactions, tx.hash, newTx)

      if (tx.time) {
        minHeight = Math.min(minHeight, tx.time)
        maxHeight = Math.max(maxHeight, tx.time)
      }
    })

    if (minHeight < Infinity) {
      state.minHeight = minHeight
    }

    if (maxHeight > 0) {
      state.maxHeight = maxHeight
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
}
