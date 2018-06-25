import Vue from 'vue'

import { resetState } from '../../../lib/reset-state'
import initialState from './state'

export default {
  /** Resets module state */
  reset (state) {
    resetState(state, initialState)
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

  /** Adds a new transaction */
  setTransaction (state, tx) {
    const newTx = Object.assign({ }, state.transactions[tx.hash], tx)
    Vue.set(state.transactions, tx.hash, newTx)
  }
}
