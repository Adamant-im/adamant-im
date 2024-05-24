import * as admApi from '../../../lib/adamant-api'
import { isErc20, Cryptos } from '../../../lib/constants'
import { parseCryptoAddressesKVStxs } from '../../../lib/store-crypto-address'

const CONTACT_LIST_KEY = 'contact_list'
const UPDATE_TIMEOUT = 3 * 60 * 1000 // 3 min
const SAVE_TIMEOUT = 30 * 1000 // 30 s
const MAXIMUM_ADDRESSES = 20 // maximum crypto addresses to fetch from KVS
const ADDRESS_VALID_TIMEOUT = 3 * 60 * 60 * 1000 // check crypto address from KVS consistency not often, than 3 hours

let bgTimer = null

export default {
  /** Resets module state */
  reset: {
    root: true,
    handler(context) {
      context.dispatch('saveContactsList')
      context.commit('reset')
      clearInterval(bgTimer)
    }
  },

  /** Starts background sync after login */
  afterLogin: {
    root: true,
    handler(context) {
      context.dispatch('startSync')
    }
  },

  /** Starts background sync after page reloads */
  rehydrate: {
    root: true,
    handler(context) {
      const passphrase = context.rootGetters.getPassPhrase
      if (passphrase) {
        context.dispatch('startSync')
      }
    }
  },

  /**
   * Fetches crypto addresses for the specified partner from KVS, and saves in state.list[payload.partner]
   * If user has many addresses for a single crypto, stores this inconsistency as well
   * @param {any} context Vuex action context
   * @param {{ crypto: string, partner: string }} payload partner address and the desired crypto, number of addresses to return (default: 1)
   * @returns {Promise<string>}
   */
  fetchAddress(context, payload) {
    if (!payload.records) payload.records = 1
    const crypto = isErc20(payload.crypto) ? Cryptos.ETH : payload.crypto

    const existingPartner = context.state.list[payload.partner]
    const existingAddress = existingPartner && existingPartner[crypto]
    const addressVerifyTimestamp = existingPartner && existingPartner[crypto + '_verifyTimestamp']

    // If we have already an address for `crypto` for `partner`, and it is fresh
    if (
      existingAddress &&
      addressVerifyTimestamp &&
      Date.now() - addressVerifyTimestamp < ADDRESS_VALID_TIMEOUT
    ) {
      if (payload.records > 1) {
        if (existingPartner[crypto + '_inconsistency']) {
          return Promise.resolve(existingPartner[crypto + '_inconsistency'])
        } else {
          return Promise.resolve([existingAddress])
        }
      } else {
        return Promise.resolve(existingAddress)
      }
    }

    const key = `${crypto}:address`.toLowerCase()
    return admApi.getStored(key, payload.partner, MAXIMUM_ADDRESSES).then(
      (txs) => {
        if (txs.length > 0) {
          const addresses = parseCryptoAddressesKVStxs(txs, crypto)
          if (addresses && !addresses.onlyLegacyLiskAddress) {
            // Some address(es) is stored
            context.commit('address', { ...payload, crypto, address: addresses.mainAddress })
            if (addresses.addressesCount > 1) {
              context.commit('addresses_inconsistency', {
                ...payload,
                crypto,
                addresses: addresses.storedAddresses
              })
            }
            if (payload.records > 1) {
              return addresses.storedAddresses
            } else {
              return addresses.mainAddress
            }
          } else {
            if (payload.moreInfo) {
              return addresses
            } else {
              return false
            }
          }
        } else {
          return false // user has no address stored in KVS yet
        }
      },
      (error) => {
        console.error(
          `Failed to fetch ${crypto} address from KVS. Nothing saved in state.list[payload.partner]`,
          payload,
          error
        )
        return false
      }
    )
  },

  /**
   * Retrieves contact list from the KVS
   * @param {any} context Vuex action context
   */
  fetchContactsList(context) {
    const lastUpdate = context.state.lastUpdate

    // Check if it's time to update
    if (Date.now() - lastUpdate < UPDATE_TIMEOUT) return

    return admApi
      .getStored(CONTACT_LIST_KEY)
      .then((cl) => context.commit('contactList', cl))
      .catch((err) => console.warn('Failed to fetch contact list', err))
  },

  /**
   * Saves contacts list to KVS
   * @param {any} context Vuex action context
   */
  saveContactsList(context) {
    const lastChange = context.state.lastChange

    // Check if it's time to save (and there are changes to save)
    if (!lastChange || Date.now() - lastChange < SAVE_TIMEOUT) return
    // Setting `lastChange` to 0 guards against redundant call while save transaction is being processed
    context.state.lastChange = 0

    const contacts = Object.keys(context.state.list).reduce((map, uid) => {
      const item = context.state.list[uid]
      map[uid] = { ...item }
      return map
    }, {})

    return admApi
      .storeValue(CONTACT_LIST_KEY, contacts, true)
      .then((response) => {
        if (!response.success) {
          console.warn('Contacts list save was rejected')
        }
      })
      .catch((err) => {
        console.warn('Failed to save contact list', err)
        // Re-mark state as dirty to save on the next tick
        context.state.lastChange = lastChange
      })
  },

  /**
   * Starts contact list sync.
   * @param {any} context Vuex action context
   */
  startSync(context) {
    context.dispatch('fetchContactsList')

    clearInterval(bgTimer)
    bgTimer = setInterval(() => {
      context.dispatch('saveContactsList')
      context.dispatch('fetchContactsList')
    }, 1000)
  }
}
