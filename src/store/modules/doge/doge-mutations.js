import baseMutations from '../btc-base/btc-base-mutations'
import state from './doge-state'

export default {
  ...baseMutations(state),

  /**
   * Stores node-specific offset state for older history pagination
   */
  oldTxState(state, value) {
    state.oldTxState = value
  }
}
