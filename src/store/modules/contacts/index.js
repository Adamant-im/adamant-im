import Vue from 'vue'

import { getContacts, updateContacts, getCryptoAddress } from '@/lib/contactHelpers'

/**
 * Create empty contact.
 * @param {string} id ADM address
 * @param {string} name Contact display name
 * @returns {Contact}
 */
const createContact = (id, name = '') => {
  return {
    id,
    name,
    cryptos: []
  }
}

/**
 * type State {
 *   contacts: Contact[]
 * }
 *
 * type Contact {
 *   id: string, // ADM address
 *   name: string, // contact name
 *   cryptos: Crypto[]
 * }
 *
 * type Crypto {
 *   id: string, // ex: ETH
 *   address: string // ex: 0x0123456789
 * }
 */
const state = () => ({
  contacts: []
})

const selectors = {
  contact: (state, userId) => state.contacts.find(contact => contact.id === userId)
}

const getters = {
  /**
   * Returns contact by userId.
   * @param {string} userId ADM address
   * @returns {Contact|undefined}
   */
  contact: state => userId => {
    return selectors.contact(state, userId)
  },

  /**
   * Returns contact name.
   * @param {string} userId ADM address
   * @returns {string|undefined}
   */
  contactName: (state, getters) => userId => {
    const contact = getters.contact(userId)

    return contact && contact.name
  },

  /**
   * Get crypto info.
   * @param {string} userId
   * @params {string} cryptoCurrency Ex: ETH
   * @returns {Crypto|undefined}
   */
  crypto: (state, getters) => (userId, cryptoCurrency) => {
    const contact = getters.contact(userId)

    if (contact) {
      return contact.cryptos.find(crypto => crypto.id === cryptoCurrency)
    }
  },

  /**
   * Get crypto address.
   * @param {string} userId
   * @params {string} cryptoCurrency Ex: ETH
   * @returns {string|undefined} Crypto address
   */
  cryptoAddress: (state, getters) => (userId, cryptoCurrency) => {
    const crypto = getters.crypto(userId, cryptoCurrency)

    return crypto && crypto.address
  }
}

const mutations = {
  setContacts (state, contacts) {
    state.contacts = contacts
  },

  /**
   * Update contact name by userId.
   * @param {{ userId: string, name: string }}
   */
  setName (state, { userId, name }) {
    const contact = selectors.contact(state, userId)

    if (contact) {
      contact.name = name
    }
  },

  /**
   * Update crypto info for specific contact.
   * @param {{ userId: string, crypto: Crypto }}
   */
  setCryptoInfo (state, payload) {
    const {
      userId,
      crypto: {
        currency,
        address
      }
    } = payload

    const contact = selectors.contact(state, userId)

    if (contact) {
      const crypto = contact.cryptos.find(crypto => crypto.currency === currency)

      // update existing crypto or push new
      if (crypto) {
        Vue.set(crypto, 'currency', currency)
        Vue.set(crypto, 'address', address)
      } else {
        contact.cryptos.push({ id: currency, address })
      }
    }
  },

  /**
   * Add new contact.
   * @param {{ userId: string, name: string }}
   */
  addContact (state, { userId, name = '' }) {
    state.contacts.push(createContact(userId, name))
  }
}

const actions = {
  /**
   * Get contact list from node.
   * @returns {Promise<contacts>}
   */
  fetchContacts ({ commit }) {
    return getContacts()
      .then(contacts => {
        commit('setContacts', contacts)

        return contacts
      })
  },

  /**
   * Send contact list to node.
   * @returns {Promise}
   */
  saveContacts ({ state }) {
    return updateContacts(state.contacts)
  },

  /**
   * Fetch contact crypto address.
   * @param {{ userId: string, cryptoCurrency: string }}
   * @returns {Promise<string>} Crypto address
   */
  fetchCryptoAddress ({ commit, getters }, { userId, cryptoCurrency }) {
    const cryptoAddress = getters.cryptoAddress(userId, cryptoCurrency)

    // if cryptoAddress is cached
    if (cryptoAddress) {
      return Promise.resolve(cryptoAddress)
    }

    return getCryptoAddress(userId, cryptoCurrency)
      .then(cryptoAddress => {
        const contact = getters.contact(userId)

        // create contact if not exists
        if (!contact) {
          commit('addContact', { userId })
        }

        commit('setCryptoInfo', {
          userId,
          crypto: {
            currency: cryptoCurrency,
            address: cryptoAddress
          }
        })

        return cryptoAddress
      })
  },

  /**
   * Update or set contact name.
   * @param {string} userId ADM address
   * @param {string} name Contact name
   * @returns {Promise}
   */
  updateName ({ getters, commit, dispatch }, { userId, name }) {
    const contact = getters.contact(userId)

    if (contact) {
      commit('setName', { userId, name })
    } else {
      commit('addContact', { userId, name })
    }

    return dispatch('saveContacts')
  }
}

export { selectors }

export default {
  state,
  getters,
  mutations,
  actions,
  namespaced: true
}
