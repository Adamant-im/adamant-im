import Vue from 'vue'

import { resetState } from '../../../lib/reset-state'
import initialState from './state'

export default {
  /** Resets module state */
  reset (state) {
    resetState(state, initialState())
  },

  /** Set ETH balance */
  balance (state, balance) {
    state.balance = balance
  },

  /** Gas price and fee */
  gasPrice (state, payload) {
    state.gasPrice = payload.gasPrice
    state.fee = payload.fee
  },

  /** Current block number */
  blockNumber (state, number) {
    state.blockNumber = number
  },

  /** Set ETH account */
  account (state, account) {
    state.address = account.address
    state.publicKey = account.publicKey
    state.privateKey = account.privateKey
  },

  /** ETH account has been published */
  isPublished (state) {
    state.isPublished = true
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

      const direction = tx.recipientId === address ? 'to' : 'from'
      const partner = direction === 'to' ? tx.senderId : tx.recipientId
      const newTx = Object.assign({ direction, partner }, state.transactions[tx.hash], tx)
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
  }
}
