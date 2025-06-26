import { resetState } from '../../../lib/reset-state'
import baseMutations from '../eth-base/eth-base-mutations'

export default (getInitialState) => ({
  /** Resets module state */
  reset(state) {
    resetState(state, getInitialState())
  },

  /** Gas price, gas limit and fee */
  gasData(state, payload) {
    state.gasPrice = payload.gasPrice
    state.gasLimit = payload.gasLimit
    state.fee = payload.fee
  },

  ...baseMutations
})
