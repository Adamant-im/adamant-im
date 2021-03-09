import Vue from 'vue'

import { resetState } from '../../../lib/reset-state'
import getInitialState from './adm-state'

export default {
  /** Resets module state */
  reset (state) {
    resetState(state, getInitialState())
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

    console.log('transactions adm to merge:', transactions.length)

    transactions.forEach(tx => {
      if (!tx) return
      Vue.set(state.transactions, tx.id, {
        ...tx,
        direction: tx.recipientId === address ? 'to' : 'from',
        partner: tx.recipientId === address ? tx.senderId : tx.recipientId
      })

      if (tx.height) {
        minHeight = Math.min(minHeight, tx.height)
        maxHeight = Math.max(maxHeight, tx.height)
      }
    })

    if (minHeight < state.minHeight) {
      state.minHeight = minHeight
      console.log('set minHeight:', minHeight)
    }

    if (maxHeight > state.maxHeight) {
      state.maxHeight = maxHeight
      console.log('set maxHeight:', maxHeight)
    }
  },

  /**
   * Sets a flag that indicates whether older transactions are being retrieved at the moment.
   * @param {{areTransactionsLoading: boolean}} state module state
   * @param {boolean} value flag value
   */
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
