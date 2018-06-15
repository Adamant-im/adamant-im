import { resetState } from '../../../lib/reset-state'
import initialState from './partners-state'

export default {
  /** Resets module state */
  reset (state) {
    resetState(state, initialState)
  },

  /**
   * Sets partner display name
   * @param {object} state current state
   * @param {{partner: string, displayName: string}} payload partner address and display name
   */
  setDisplayName (state, { partner, displayName }) {
    state[partner] = Object.assign({ }, state[partner], { displayName })
  },

  /**
   * Sets partner address for the specified crypto
   * @param {object} state current state
   * @param {{partner: string, crypto: string, address: string}} payload partner ADM address, crypto and crypto address
   */
  setAddress (state, payload) {
    state[payload.partner] = Object.assign({ }, state[payload.partner],
      { [payload.crypto]: payload.address })
  }
}
