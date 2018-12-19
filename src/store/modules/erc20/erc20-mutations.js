import { resetState } from '../../../lib/reset-state'
import baseMutations from '../eth-base/eth-base-mutations'

export default getInitialState => ({
  /** Resets module state */
  reset (state) {
    resetState(state, getInitialState())
  },

  ...baseMutations
})
