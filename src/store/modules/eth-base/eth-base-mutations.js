import { isStringEqualCI } from '@/lib/textHelpers'

export default {
  /** Set ETH balance */
  balance(state, balance) {
    state.balance = balance
  },

  /**
   * @param state
   * @param status {FetchStatus}
   */
  setBalanceStatus(state, status) {
    state.balanceStatus = status
  },

  /** Set ETH account */
  account(state, account) {
    state.address = account.address
    state.publicKey = account.publicKey
    state.privateKey = account.privateKey
    state.web3Account = account.web3Account
  },

  /** Sets a flag, indicating that the oldest transaction has been retrieved for this account */
  bottom(state, value) {
    state.bottomReached = value
  },

  /**
   * Adds new transactions
   * @param {{transactions: object, minHeight: number, maxHeight: number}} state current state
   * @param {Array<{hash: string, time: number}>} transactions transactions list
   */
  transactions(state, transactions) {
    const updateTimestamps = transactions.updateTimestamps
    if (updateTimestamps) {
      transactions = transactions.transactions
    }
    let minHeight = Infinity
    let maxHeight = -1

    const address = state.address

    transactions.forEach((tx) => {
      if (!tx) return

      Object.keys(tx).forEach((key) => tx[key] === undefined && delete tx[key])

      const direction = isStringEqualCI(tx.recipientId, address) ? 'to' : 'from'
      const newTx = Object.assign({ direction, id: tx.hash }, state.transactions[tx.hash], tx)

      state.transactions[tx.hash] = newTx

      if (tx.time && updateTimestamps) {
        minHeight = Math.min(minHeight, tx.time)
        maxHeight = Math.max(maxHeight, tx.time)
      }
    })

    // Magic here helps to refresh Tx list when browser deletes it
    const txCount = Object.keys(state.transactions).length
    if (state.transactionsCount < txCount) {
      // We don't delete transactions, so they can't become in short
      state.transactionsCount = txCount
    }

    if (minHeight < state.minHeight) {
      state.minHeight = minHeight
    }

    if (maxHeight > state.maxHeight) {
      state.maxHeight = maxHeight
    }
  },
  areOlderLoading(state, areLoading) {
    state.areOlderLoading = areLoading
  },
  areRecentLoading(state, areLoading) {
    state.areRecentLoading = areLoading
  },
  areTransactionsLoading(state, areLoading) {
    state.areTransactionsLoading = areLoading
  }
}
