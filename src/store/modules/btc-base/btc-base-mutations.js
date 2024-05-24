import { resetState } from '../../../lib/reset-state'

export default (initialState) => ({
  /** Resets module state */
  reset(state) {
    resetState(state, initialState())
  },

  address(state, address) {
    state.address = address
  },

  status(state, { balance }) {
    state.balance = balance
    state.lastStatusUpdate = Date.now()
  },

  /**
   * @param state
   * @param status {FetchStatus}
   */
  setBalanceStatus(state, status) {
    state.balanceStatus = status
  },

  /** Sets a flag, indicating that the oldest transaction has been retrieved for this account */
  bottom(state, value) {
    state.bottomReached = value
  },

  transactions(state, transactions) {
    transactions.forEach((tx) => {
      if (!tx) return

      Object.keys(tx).forEach((key) => tx[key] === undefined && delete tx[key])

      const newTx = Object.assign({}, state.transactions[tx.hash], tx)

      state.transactions[tx.hash] = newTx
    })
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
})
