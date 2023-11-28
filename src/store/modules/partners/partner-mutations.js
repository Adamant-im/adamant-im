import { resetState } from '../../../lib/reset-state'
import initialState from './partners-state'

export default {
  /** Resets module state */
  reset(state) {
    resetState(state, initialState())
  },

  /**
   * Sets partner display name
   * @param {object} state current state
   * @param {{partner: string, displayName: string}} payload partner address and display name
   */
  displayName(state, { partner, displayName }) {
    if (Object.prototype.hasOwnProperty.call(state.list, partner)) {
      state.list[partner].displayName = displayName
    } else {
      // if partner is not in the list, add
      state.list[partner] = { displayName }
    }
    state.lastChange = Date.now()
  },

  /**
   * Sets partner address for the specified crypto
   * @param {object} state current state
   * @param {{partner: string, crypto: string, address: string}} payload partner ADM address, crypto and crypto address
   */
  address(state, payload) {
    state.list[payload.partner] = Object.assign({}, state.list[payload.partner], {
      [payload.crypto]: payload.address
    })
    state.list[payload.partner] = Object.assign({}, state.list[payload.partner], {
      [payload.crypto + '_verifyTimestamp']: Date.now()
    })
  },

  /**
   * Sets partner addresses for the specified crypto
   * It's bad thing: user must have only one address in KVS for each crypto
   * @param {object} state current state
   * @param {{partner: string, crypto: string, addresses: array}} payload partner ADM address, crypto and array of crypto addresses
   */
  addresses_inconsistency(state, payload) {
    state.list[payload.partner] = Object.assign({}, state.list[payload.partner], {
      [payload.crypto + '_inconsistency']: payload.addresses
    })
  },

  /**
   * Sets contact list data, retrieved from server
   * @param {object} state current state
   * @param {Object.<string, {displayName: string}>} contacts contacts list
   */
  contactList(state, contacts) {
    if (contacts) {
      Object.keys(contacts).forEach((uid) => {
        state.list[uid] = Object.assign({}, state.list[uid], contacts[uid])
      })
    }
    state.lastUpdate = Date.now()
  }
}
