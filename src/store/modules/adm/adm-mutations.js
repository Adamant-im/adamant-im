import Vue from 'vue'

import { resetState } from '../../../lib/reset-state'
import initialState from './adm-state'

export default {
  /** Resets module state */
  reset (state) {
    resetState(state, initialState)
  },

  /** Sets current ADM address */
  address (state, address) {
    state.address = address
  },

  /** Sets a flag, indicating that the oldest transaction has been retrieved for this account */
  bottom (state) {
    state.bottomReached = true
  },

  /**
   * Sets transactions list appending or replacing existing ones.
   * @param {{transactions: object, minHeight: number, maxHeight: number}} state current state
   * @param {Array<{id: string, height: number}>} transactions transactions list
   */
  transactions (state, transactions) {
    let minHeight = Infinity
    let maxHeight = 0

    const address = state.address

    transactions.forEach(tx => {
      if (!tx) return
      Vue.set(state.transactions, tx.id, {
        ...tx,
        direction: tx.recipientId === address ? 'to' : 'from',
        partner: tx.recipientId === address ? tx.senderId : tx.recipientId
      })
      minHeight = Math.min(minHeight, tx.height)
      maxHeight = Math.max(maxHeight, tx.height)
    })

    if (minHeight < Infinity) {
      state.minHeight = minHeight
    }

    if (maxHeight > 0) {
      state.maxHeight = maxHeight
    }
  }
}
