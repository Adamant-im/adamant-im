import sinon from 'sinon'
import cloneDeep from 'lodash/cloneDeep'

// mockup `@/lib/contactHelpers`
// to avoid importing `@/store`
/* eslint-disable */
jest.mock('@/lib/contactHelpers')
import { getContacts, updateContacts, getCryptoAddress } from '@/lib/contactHelpers'

import module, { selectors } from '@/store/modules/contacts'
/* eslint-enable */

const { getters, mutations, actions } = module

/** Helpers **/
const mockFn = (name, fn) => {
  module.__Rewire__(name, fn)
}

/** Mockup State **/
function createState () {
  return {
    contacts: [
      {
        id: 'U111111',
        name: 'Rick',
        cryptos: [
          { id: 'ETH', address: 'Ex111111' }
        ]
      },
      {
        id: 'U222222',
        name: 'Morty',
        cryptos: [
          { id: 'ETH', address: 'Ex222222' },
          { id: 'BNB', address: 'Bx222222' }
        ]
      },
      {
        id: 'U333333',
        name: '',
        cryptos: []
      }
    ]
  }
}

describe('contacts.js vuex module', () => {
  describe('state', () => {
    it('check default state', () => {
      expect(module.state()).toEqual({
        contacts: []
      })
    })
  })

  describe('selectors.contact', () => {
    const state = {
      contacts: [
        { id: 'U111111' },
        { id: 'U222222' },
        { id: 'U333333' }
      ]
    }

    it('should return `Contact` if exists', () => {
      expect(selectors.contact(state, 'U111111')).toEqual({ id: 'U111111' })
      expect(selectors.contact(state, 'U222222')).toEqual({ id: 'U222222' })
    })

    it('should return `undefined` if does not exists', () => {
      expect(selectors.contact(state, 'U444444')).toBe(undefined)
    })
  })

  describe('getters.contact', () => {
    const state = {
      contacts: [
        { id: 'U111111' },
        { id: 'U222222' },
        { id: 'U333333' }
      ]
    }
    const contact = getters.contact(state)

    it('should return `Contact` if exists', () => {
      expect(contact('U111111')).toEqual({ id: 'U111111' })
      expect(contact('U222222')).toEqual({ id: 'U222222' })
    })

    it('should return `undefined` if does not exists', () => {
      expect(contact('U444444')).toBe(undefined)
    })
  })

  describe('getters.contactName', () => {
    const state = {
      contacts: [
        { id: 'U111111', name: 'Rick' },
        { id: 'U222222', name: 'Morthy' },
        { id: 'U333333', name: '' }
      ]
    }
    const name = getters.contactName(state, {
      contact: getters.contact(state)
    })

    it('should return contact name', () => {
      expect(name('U111111')).toBe('Rick')
      expect(name('U222222')).toBe('Morthy')
    })

    it('should return `undefined` if no contact or empty name', () => {
      expect(name('U333333')).toBe('') // empty name
      expect(name('U444444')).toBe(undefined) // nonexistent contact
    })
  })

  describe('getters.crypto', () => {
    let state = null
    let crypto = null // fn getter

    beforeEach(() => {
      state = createState()
      crypto = getters.crypto(state, {
        contact: getters.contact(state)
      })
    })

    it('should return `Crypto`', () => {
      expect(crypto('U111111', 'ETH')).toEqual({ id: 'ETH', address: 'Ex111111' })
      expect(crypto('U222222', 'ETH')).toEqual({ id: 'ETH', address: 'Ex222222' })
      expect(crypto('U222222', 'BNB')).toEqual({ id: 'BNB', address: 'Bx222222' })
    })

    it('should return `undefined`', () => {
      expect(crypto('U111111', 'BZ')).toEqual(undefined) // if no crypto in list
      expect(crypto('U333333', 'ETH')).toEqual(undefined) // if `cryptos` is empty array
      expect(crypto('U444444', 'ETH')).toEqual(undefined) // if no contact in list
    })
  })

  describe('getters.cryptoAddress', () => {
    let state = null
    let cryptoAddress = null // fn getter

    beforeEach(() => {
      state = createState()
      cryptoAddress = getters.cryptoAddress(state, {
        crypto: getters.crypto(state, {
          contact: getters.contact(state)
        })
      })
    })

    it('should return `cryptoAddress`', () => {
      expect(cryptoAddress('U111111', 'ETH')).toEqual('Ex111111')
      expect(cryptoAddress('U222222', 'ETH')).toEqual('Ex222222')
      expect(cryptoAddress('U222222', 'BNB')).toEqual('Bx222222')
    })

    it('should return `undefined`', () => {
      expect(cryptoAddress('U111111', 'BZ')).toEqual(undefined) // if no crypto in list
      expect(cryptoAddress('U333333', 'ETH')).toEqual(undefined) // if `cryptos` is empty array
      expect(cryptoAddress('U444444', 'ETH')).toEqual(undefined) // if no contact in list
    })
  })

  describe('mutations.setContacts', () => {
    it('should mutate `state.contacts`', () => {
      const state = {
        contacts: []
      }

      mutations.setContacts(state, [1, 2, 3])
      expect(state.contacts).toEqual([1, 2, 3])

      mutations.setContacts(state, [4, 5, 6])
      expect(state.contacts).toEqual([4, 5, 6])
    })
  })

  describe('mutations.setName', () => {
    const cloneState = () => ({
      contacts: [
        {
          id: 'U111111',
          name: ''
        },
        {
          id: 'U222222',
          name: ''
        }
      ]
    })
    let state = null

    beforeEach(() => {
      state = cloneState()
    })

    it('should set name if contact exists', () =>  {
      mutations.setName(state, { userId: 'U111111', name: 'Rick' })
      expect(state.contacts[0].name).toBe('Rick')

      mutations.setName(state, { userId: 'U222222', name: 'Morty' })
      expect(state.contacts[1].name).toBe('Morty')

      mutations.setName(state, { userId: 'U222222', name: 'Morty Smith' })
      expect(state.contacts[1].name).toBe('Morty Smith')
    })

    it('should not mutate state if contact does not exists', () => {
      mutations.setName(state, { userId: 'U333333', name: 'Rick' })

      expect(state).toEqual(state)
    })
  })

  describe('mutations.setCryptoInfo', () => {
    let state = null

    let contactRick = {
      id: 'U111111',
      name: 'Rick',
      cryptos: [
        {
          id: 'BNB',
          address: '0x111111'
        }
      ]
    }

    let contactMorty = {
      id: 'U222222',
      name: 'Morty',
      cryptos: []
    }

    beforeEach(() => {
      state = {
        contacts: [
          cloneDeep(contactRick),
          cloneDeep(contactMorty)
        ]
      }
    })

    it('should push crypto info if does not exists', () => {
      let userId = 'U111111'
      let crypto = {
        currency: 'ETH',
        address: '0x111111'
      }

      mutations.setCryptoInfo(state, { userId, crypto })

      expect(state.contacts).toEqual([
        {
          ...contactRick,
          cryptos: [
            {
              id: 'BNB',
              address: '0x111111'
            },
            {
              id: 'ETH',
              address: '0x111111'
            }
          ]
        },
        contactMorty
      ])
    })

    it('should update crypto info if exists', () => {
      let userId = 'U111111'
      let crypto = {
        id: 'BNB',
        address: '0x222222'
      }

      // check default state
      expect(state.contacts).toEqual([
        contactRick,
        contactMorty
      ])

      // should update BNB address
      mutations.setCryptoInfo(state, { userId, crypto })
      expect(state.contacts).toEqual([
        {
          ...contactRick,
          cryptos: [
            {
              id: 'BNB',
              address: '0x222222'
            }
          ]
        },
        contactMorty
      ])
    })

    it('should not update if contact does not exists', () => {
      let userId = 'U333333' // nonexistent contact
      let crypto = {
        id: 'ETH',
        address: '0x111111'
      }

      mutations.setCryptoInfo(state, { userId, crypto })

      expect(state.contacts).toEqual([
        contactRick,
        contactMorty
      ])
    })
  })

  describe('mutations.addContact', () => {
    it('should push contact to `state.contacts`', () => {
      const state = {
        contacts: []
      }

      const contact1 = { userId: 'U111111', name: 'Rick' }
      const contact2 = { userId: 'U222222', name: 'Morty' }
      const contact3 = { userId: 'U333333' }

      mutations.addContact(state, contact1)
      mutations.addContact(state, contact2)
      mutations.addContact(state, contact3)

      expect(state.contacts).toEqual([
        { id: 'U111111', name: 'Rick', cryptos: [] },
        { id: 'U222222', name: 'Morty', cryptos: [] },
        { id: 'U333333', name: '', cryptos: [] }
      ])
    })
  })

  describe('actions.fetchContacts', () => {
    it('should resolve Promise', async () => {
      mockFn('getContacts', () => Promise.resolve([]))

      const commit = sinon.spy()

      await expect(actions.fetchContacts({ commit }))
        .resolves.toEqual([])

      expect(commit.args).toEqual([
        ['setContacts', []]
      ])
    })

    it('should reject Promise', async () => {
      mockFn('getContacts', () => Promise.reject(new Error('Server error')))

      const commit = sinon.spy()

      await expect(actions.fetchContacts({ commit }))
        .rejects.toEqual(new Error('Server error'))

      expect(commit.args).toEqual([])
    })
  })

  describe('actions.saveContacts', () => {
    const state = {
      contacts: []
    }

    it('should resolve Promise', async () => {
      mockFn('updateContacts', () => Promise.resolve({ success: true }))

      await expect(actions.saveContacts({ state }))
        .resolves.toEqual({ success: true })
    })

    it('should reject Promise', async () => {
      mockFn('updateContacts', () => Promise.reject(new Error('Server error')))

      await expect(actions.saveContacts({ state }))
        .rejects.toEqual(new Error('Server error'))
    })
  })

  describe('actions.fetchCryptoAddress', () => {
    const userId = 'U111111'
    const cryptoCurrency = 'ETH'
    const cryptoAddress = '0x0123456789'
    let state = null

    beforeEach(() => {
      state = createState()
    })

    it('should add contact if not exists', async () => {
      mockFn('getCryptoAddress', () => Promise.resolve(cryptoAddress))

      const mockGetters = {
        contact: () => null, // contact not exists
        cryptoAddress: () => false // crypto address is not cached
      }

      const commit = sinon.spy()
      const userId = 'U444444' // non-existent contact

      await expect(actions.fetchCryptoAddress({ commit, getters: mockGetters }, { userId, cryptoCurrency }))
        .resolves.toEqual(cryptoAddress)

      expect(commit.args).toEqual([
        ['addContact', { userId }],
        ['setCryptoInfo', {
          userId,
          crypto: {
            currency: cryptoCurrency,
            address: cryptoAddress
          }
        }]
      ])
    })

    it('should resolve Promise immediately if `cryptoAddres` is cached', async () => {
      mockFn('getCryptoAddress', () => Promise.resolve(cryptoAddress))

      const mockGetters = {
        contact: () => ({}), // truthy
        cryptoAddress: () => cryptoAddress
      }
      const commit = sinon.spy()

      await expect(actions.fetchCryptoAddress({ commit, getters: mockGetters }, {
        userId: 'U111111',
        cryptoCurrency: 'ETH'
      }))
        .resolves.toEqual(cryptoAddress)

      expect(commit.args).toEqual([]) // should commit nothing
    })

    it('should fetch `cryptoAddress` from node and resolve Promise', async () => {
      mockFn('getCryptoAddress', () => Promise.resolve(cryptoAddress))

      const mockGetters = {
        contact: () => ({}), // truthy
        cryptoAddress: () => false // cryptoAddress is not cached
      }
      const commit = sinon.spy()

      await expect(actions.fetchCryptoAddress({ commit, getters: mockGetters }, {
        userId: 'U111111',
        cryptoCurrency: 'ETH'
      }))
        .resolves.toEqual(cryptoAddress)

      expect(commit.args).toEqual([
        ['setCryptoInfo', {
          userId,
          crypto: {
            currency: cryptoCurrency,
            address: cryptoAddress
          }
        }]
      ])
    })

    it('should reject Promise', async () => {
      mockFn('getCryptoAddress', () => Promise.reject(new Error('Server error')))

      const mockGetters = {
        contact: () => ({}),
        cryptoAddress: () => false
      }
      const commit = sinon.spy()

      await expect(actions.fetchCryptoAddress({ commit, getters: mockGetters }, { userId, cryptoCurrency }))
        .rejects.toEqual(new Error('Server error'))

      expect(commit.args).toEqual([])
    })
  })

  describe('actions.updateName', () => {
    const userId = 'U111111'
    const name = 'Rick'

    it('should update contact name and sync with node', () => {
      const mockGetters = {
        contact: () => ({}) // contact exists
      }
      const commit = sinon.spy()
      const dispatch = sinon.spy()

      actions.updateName({ getters: mockGetters, commit, dispatch }, { userId, name })

      expect(commit.args).toEqual([
        ['setName', { userId, name }]
      ])
      expect(dispatch.args).toEqual([
        ['saveContacts']
      ])
    })

    it('should create contact if not exists', () => {
      const mockGetters = {
        contact: () => false // contact not exists
      }
      const commit = sinon.spy()
      const dispatch = sinon.spy()

      actions.updateName({ getters: mockGetters, commit, dispatch }, { userId, name })

      expect(commit.args).toEqual([
        ['addContact', { userId, name }]
      ])
      expect(dispatch.args).toEqual([
        ['saveContacts']
      ])
    })
  })
})
