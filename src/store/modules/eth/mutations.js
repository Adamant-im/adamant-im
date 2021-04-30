import { resetState } from '../../../lib/reset-state'
import initialState from './state'

import baseMutations from '../eth-base/eth-base-mutations'

export default {
  ...baseMutations,

  /** Resets module state */
  reset (state) {
    resetState(state, initialState())
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

  /** ETH account has been published */
  isPublished (state) {
    state.isPublished = true
  }
}
