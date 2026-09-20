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

  setBalanceActualUntil(state, value) {
    state.balanceActualUntil = value
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
   * Adds new transactions.
   *
   * Deliberately does not touch `minHeight` / `maxHeight`: `time` is a block
   * timestamp and is not unique, so a page can be cut in the middle of a group
   * of transactions sharing one timestamp. Only the caller knows whether a
   * boundary is proven, and it moves it with `setMinHeight` / `setMaxHeight`.
   *
   * @param {{transactions: object, minHeight: number, maxHeight: number}} state current state
   * @param {Array<{hash: string, time: number}>} transactions transactions list
   */
  transactions(state, transactions) {
    const address = state.address

    transactions.forEach((tx) => {
      if (!tx) return

      Object.keys(tx).forEach((key) => tx[key] === undefined && delete tx[key])

      const direction = isStringEqualCI(tx.recipientId, address) ? 'to' : 'from'
      const newTx = Object.assign({ direction, id: tx.hash }, state.transactions[tx.hash], tx)

      state.transactions[tx.hash] = newTx
    })

    // Magic here helps to refresh Tx list when browser deletes it
    const txCount = Object.keys(state.transactions).length
    if (state.transactionsCount < txCount) {
      // We don't delete transactions, so they can't become in short
      state.transactionsCount = txCount
    }
  },
  /**
   * Raises the upper boundary of the retrieved history.
   *
   * Unlike the `transactions` mutation this is explicit: `time` is a block
   * timestamp, so a catch-up interrupted in the middle of a group sharing one
   * timestamp must leave the boundary *below* that group. Otherwise the next
   * update starts above it and the unread part is never requested again.
   */
  setMaxHeight(state, value) {
    if (value > state.maxHeight) {
      state.maxHeight = value
    }
  },

  /**
   * Lowers the bottom boundary of the retrieved history. The mirror image of
   * `setMaxHeight`: a page cut inside the group at its oldest timestamp must
   * leave the boundary *above* that group, so that the next page reads it again
   * instead of stepping below it.
   */
  setMinHeight(state, value) {
    if (value < state.minHeight) {
      state.minHeight = value
    }
  },

  /**
   * Remembers how far a group sharing one block timestamp has been read, so that
   * an update which ran out of its page budget continues instead of starting over.
   */
  setTimestampGroupCursor(state, cursor) {
    state.timestampGroupCursor = cursor
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
