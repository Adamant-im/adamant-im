import isPlainObject from 'lodash/isPlainObject'

import * as admApi from '@/lib/adamant-api'
import { Cryptos, isErc20 } from '@/lib/constants'

const CONTACT_LIST_KEY = 'contact_list'
/**
 * @param {string} crypto Ex: 'ETH'
 * @returns {string}
 */
const CRYPTO_ADDRESS_KEY = crypto => `${crypto}:address`.toLowerCase()

/**
 * Transform {KVSContact} to {Contact}.
 *
 * Change structure of KVS `contacts` from
 * KVSContact => Contact, until AIP is accepted.
 *
 * Important:
 * Don't save wallet addresses in KVS `contact_list`,
 * only `displayName`, because wallets are stored in
 * another KVS `eth:address`.
 *
 * type KVSContact: {
 *   [admAddress: string]: {
 *     displayName?: string
 *   }
 * }
 *
 * type Contact {
 *   id: string, // ADM address
 *   name: string, // contact name
 *   publicKey?: string, // not saved at the moment
 *   cryptos: Crypto[]
 * }
 *
 * @param {KVSContact[]} kvsContacts
 * @returns {Contact[]}
 */
function transformContacts (kvsContacts) {
  let contacts = []

  if (isPlainObject(kvsContacts)) {
    const contactIds = Object.keys(kvsContacts)

    return contactIds.map(contactId => {
      const contactData = kvsContacts[contactId]

      return {
        id: contactId,
        name: contactData.displayName || '',
        cryptos: []
      }
    })
  }

  return contacts
}

/**
 * Transform {Contact} to {KVSContact}
 * @param {Contact[]} contacts
 * @returns {KVSContact[]}
 */
function transformContactsReverse (contacts) {
  let kvsContacts = {}

  contacts.forEach(contact => {
    kvsContacts[contact.id] = {
      displayName: contact.name
    }
  })

  return kvsContacts
}

/**
 * Return user contact list.
 * @returns {Promise<Contact[]>}
 */
export function getContacts () {
  return admApi.getStored(CONTACT_LIST_KEY)
    .then(contacts => transformContacts(contacts))
    .catch(err => {
      console.error('Failed to fetch contact list', err)

      throw err
    })
}

/**
 * Update contact list.
 * @param {Contact[]} contacts
 * @returns {Promise}
 */
export function updateContacts (contacts) {
  const kvsContacts = transformContactsReverse(contacts)

  return admApi.storeValue(CONTACT_LIST_KEY, kvsContacts, true)
    .then(response => {
      if (!response.success) {
        throw new Error('Contacts list save was rejected')
      }
    })
    .catch(err => {
      console.error('Failed to save contact list', err)

      throw err
    })
}

/**
 * Returns crypto address by userId.
 * @param {string} userId ADM address
 * @param {string} cryptoCurrency Ex: 'ETH'
 * @returns {Promise<string>} Crypto address
 */
export function getCryptoAddress (userId, cryptoCurrency) {
  const crypto = isErc20(cryptoCurrency) ? Cryptos.ETH : cryptoCurrency

  return admApi.getStored(CRYPTO_ADDRESS_KEY(crypto), userId)
    .then(cryptoAddress => {
      if (!cryptoAddress) {
        throw new Error(`User ${userId} does not have ${cryptoCurrency} wallet`)
      }

      return cryptoAddress
    })
    .catch(err => {
      console.error(err)

      throw err
    })
}
