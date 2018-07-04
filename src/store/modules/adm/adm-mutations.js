import Vue from 'vue'

import { resetState } from '../../../lib/reset-state'
import initialState from './adm-state'

export default {
  /** Resets module state */
  reset (state) {
    resetState(state, initialState)
  },

  /**
   * Sets transactions list appending or replacing existing ones.
   * @param {{transactions: object, minHeight: number, maxHeight: number}} state current state
   * @param {Array<{id: string, height: number}>} transactions transactions list
   */
  transactions (state, transactions) {
    let minHeight = Infinity
    let maxHeight = 0

    transactions.forEach(tx => {
      Vue.set(state.transactions, tx.id, tx)
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
