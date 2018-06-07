import * as admApi from '../../../lib/adamant-api'
import { resetAction } from '../../../lib/reset-state'

export default {
  /** Resets module state */
  reset: resetAction,

  /**
   * Fetches crypto address for the specified partner
   * @param {any} context Vuex action context
   * @param {{ crypto: string, partner: string }} payload partner address and the desired crypto
   * @returns {Promise<string>}
   */
  fetchAddress (context, payload) {
    const existingPartner = context.state[payload.partner]
    const existingAddress = existingPartner && existingPartner[payload.crypto]
    if (existingAddress) return Promise.resolve(existingAddress)

    const key = `${payload.crypto}:address`.toLowerCase()

    admApi.getStored(key, payload.partner).then(
      address => context.commit('setAddress', { ...payload, address }),
      error => {
        console.error('Failed to fetch address', payload, error)
        return false
      }
    )
  }
}
