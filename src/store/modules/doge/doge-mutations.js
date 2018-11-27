import { resetState } from '../../../lib/reset-state'
import initialState from './doge-state'

export default {
  /** Resets module state */
  reset (state) {
    resetState(state, initialState())
  },

  address (state, address) {
    state.address = address
  },

  status (state, { balance }) {
    state.balance = balance
    state.lastStatusUpdate = Date.now()
  }
}
