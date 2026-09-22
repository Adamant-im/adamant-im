import baseMutations from '../btc-base/btc-base-mutations'
import state from './btc-state'

export default {
  ...baseMutations(state),

  utxo(state, utxo = []) {
    state.utxo = utxo
  },

  feeRate(state, feeRate = 0) {
    state.feeRate = feeRate
  },

  height(state, height) {
    state.height = height
  },

  /**
   * Stores (or clears, with `null`) the resume point of an unfinished walk
   * towards the previously known history
   */
  newTxCatchUp(state, value) {
    state.newTxCatchUp = value
  },

  /**
   * Stores node-specific cursor state for older history pagination
   */
  oldTxState(state, value) {
    state.oldTxState = value
  }
}
