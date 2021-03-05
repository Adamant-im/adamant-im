import baseMutations from '../lsk-base/lsk-base-mutations'
import state from './lsk-state'

export default {
  ...baseMutations(state),

  // utxo (state, utxo = []) {
  //   state.utxo = utxo
  // },

  feeRate (state, feeRate = 0) {
    state.feeRate = feeRate
  },

  height (state, height) {
    state.height = height
  }
}
