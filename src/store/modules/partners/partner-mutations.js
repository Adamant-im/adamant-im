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
  displayName (state, { partner, displayName }) {
    state.list[partner] = Object.assign({ }, state.list[partner], { displayName })
    state.lastChange = Date.now()
  },

  /**
   * Sets partner address for the specified crypto
   * @param {object} state current state
   * @param {{partner: string, crypto: string, address: string}} payload partner ADM address, crypto and crypto address
   */
  address (state, payload) {
    state.list[payload.partner] = Object.assign({ }, state.list[payload.partner],
      { [payload.crypto]: payload.address })
  },

  /**
   * Sets contact list data, retrieved from server
   * @param {object} state current state
   * @param {Object.<string, {displayName: string}>} contacts contacts list
   */
  contactList (state, contacts) {
    if (!contacts) return
    Object.keys(contacts).forEach(uid => {
      state.list[uid] = Object.assign({ }, state.list[uid], contacts[uid])
    })
    state.lastUpdate = Date.now()
  }
}
