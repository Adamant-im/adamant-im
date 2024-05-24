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
  }
}
