import baseMutations from '../lsk-base/lsk-base-mutations'
import state from './lsk-state'

export default {
  ...baseMutations(state),

  feeRate (state, feeRate = 0) {
    state.feeRate = feeRate
  },

  height (state, height) {
    state.height = height
  }
}
