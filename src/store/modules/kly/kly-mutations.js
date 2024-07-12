import baseMutations from '../kly-base/kly-base-mutations'
import state from './kly-state'

export default {
  ...baseMutations(state),

  feeRate(state, feeRate = 0) {
    state.feeRate = feeRate
  },

  height(state, height) {
    state.height = height
  }
}
