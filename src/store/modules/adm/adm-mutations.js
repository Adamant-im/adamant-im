import { resetState } from '../../../lib/reset-state'
import getInitialState from './adm-state'
import { isStringEqualCI } from '@/lib/textHelpers'

export default {
  /** Resets module state */
  reset(state) {
    resetState(state, getInitialState())
  },

  /** Sets current ADM address */
  address(state, address) {
    state.address = address
  },

  /** Sets a flag, indicating that the oldest transaction has been retrieved for this account */
  bottom(state, value) {
    state.bottomReached = value
  },

  /**
   * Sets transactions list appending or replacing existing ones.
   * @param {{transactions: object, minHeight: number, maxHeight: number}} state current state
   * @param {Array<{id: string, height: number}>} transactions transactions list
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

      state.transactions[tx.id] = {
        ...tx,
        direction: isStringEqualCI(tx.recipientId, address) ? 'to' : 'from',
        partner: isStringEqualCI(tx.recipientId, address) ? tx.senderId : tx.recipientId,
        status:
          tx.height || tx.confirmations > 0 ? 'CONFIRMED' : tx.status ? tx.status : 'REGISTERED'
      }

      if (tx.height && updateTimestamps) {
        minHeight = Math.min(minHeight, tx.height)
        maxHeight = Math.max(maxHeight, tx.height)
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

  /**
   * Sets a flag that indicates whether older transactions are being retrieved at the moment.
   * @param {{areTransactionsLoading: boolean}} state module state
   * @param {boolean} value flag value
   */
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
