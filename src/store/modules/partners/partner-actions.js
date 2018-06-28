import * as admApi from '../../../lib/adamant-api'

const CONTACT_LIST_KEY = 'contact_list'
const UPDATE_TIMEOUT = 3 * 60 * 1000 // 3 min
const SAVE_TIMEOUT = 30 * 1000 // 30 s

let bgTimer = null

export default {
  /** Resets module state */
  reset: {
    root: true,
    handler (context) {
      context.commit('reset')
      clearInterval(bgTimer)
    }
  },

  /** Starts background sync after login */
  afterLogin: {
    root: true,
    handler (context) {
      context.dispatch('startSync')
    }
  },

  /** Starts background sync after page reloads */
  rehydrate: {
    root: true,
    handler (context) {
      context.dispatch('startSync')
    }
  },

  /**
   * Fetches crypto address for the specified partner
   * @param {any} context Vuex action context
   * @param {{ crypto: string, partner: string }} payload partner address and the desired crypto
   * @returns {Promise<string>}
   */
  fetchAddress (context, payload) {
    const existingPartner = context.state.list[payload.partner]
    const existingAddress = existingPartner && existingPartner[payload.crypto]
    if (existingAddress) return Promise.resolve(existingAddress)

    const key = `${payload.crypto}:address`.toLowerCase()

    return admApi.getStored(key, payload.partner).then(
      address => {
        context.commit('address', { ...payload, address })
        return address
      },
      error => {
        console.error('Failed to fetch address', payload, error)
        return false
      }
    )
  },

  /**
   * Retrieves contact list from the KVS
   * @param {any} context Vuex action context
   */
  fetchContactsList (context) {
    return admApi.getStored(CONTACT_LIST_KEY)
      .then(cl => context.commit('contactList', JSON.parse(cl)))
      .catch(err => console.warn('Failed to fetch contact list', err))
  },

  /**
   * Saves contacts list to KVS
   * @param {any} context Vuex action context
   */
  saveContactsList (context) {
    const contacts = context.state.list
    return admApi.storeValue(CONTACT_LIST_KEY, contacts)
      .then(() => { context.state.lastChange = 0 })
      .catch(err => console.warn('Failed to save contact list', err))
  },

  /**
   * Starts contact list sync.
   * @param {any} context Vuex action context
   */
  startSync (context) {
    clearInterval(bgTimer)
    bgTimer = setInterval(() => {
      const { lastChange, lastUpdate } = context.state

      if (lastChange && (Date.now() - lastChange) > SAVE_TIMEOUT) {
        context.commit('saveContactsList')
      }

      if (lastUpdate && (Date.now() - lastUpdate) > UPDATE_TIMEOUT) {
        context.commit('fetchContactsList')
      }
    }, 1000)
  }
}
