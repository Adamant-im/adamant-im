import sinon from 'sinon'

import { Base64 } from 'js-base64'
import storeModule, { store } from '@/store'

// mockup languageModule to avoid importing i18n dependency
jest.mock('@/store/modules/language', () => {
  return {
    state: () => ({}),
    namespaced: true
  }
})
jest.mock('@/store/modules/adm', () => {
  return {
    state: () => ({}),
    namespaced: true
  }
})

const { getters, mutations, actions } = store

const fakeData = {
  address: 'U123456',
  balance: 1000,
  passphrase: 'lorem ipsum',
  publicKey: 'publicKey',
  privateKey: 'privateKey',
  password: '',
  IDBReady: false,
  publicKeys: {}
}

describe('store', () => {
  let state = null

  beforeEach(() => {
    state = store.state()
  })

  it('should return `true` when logged', () => {
    // not logged
    expect(getters.isLogged(state)).toBe(false)

    // logged
    state.passphrase = 'passphrase'
    expect(getters.isLogged(state)).toBe(true)
  })

  it('should mutate state', () => {
    // default state
    expect(state.address).toBe('')
    expect(state.balance).toBe(0)
    expect(state.passphrase).toBe('')

    // apply mutations
    mutations.setAddress(state, 'U123456')
    mutations.setBalance(state, 1000)
    mutations.setPassphrase(state, 'lorem ipsum')

    expect(state.address).toBe('U123456')
    expect(state.balance).toBe(1000)
    expect(state.passphrase).toBe(Base64.encode('lorem ipsum'))
  })

  it('should reset state', () => {
    state = {
      address: 'U123456',
      balance: 1000,
      passphrase: 'lorem ipsum',
      publicKey: 'publicKey',
      privateKey: 'privateKey',
      password: 'password',
      IDBReady: true,
      publicKeys: {
        U123456: 'key'
      }
    }

    mutations.reset(state)

    expect(state).toEqual({
      address: '',
      balance: 0,
      passphrase: '',
      publicKey: '',
      privateKey: '',
      password: '',
      IDBReady: false,
      publicKeys: {}
    })
  })

  it('should fetch messages from node if is logged', () => {
    const dispatch = sinon.spy(() => ({ catch: () => {} })) // also mock `catch` attr
    const mockGetters = {
      isLogged: true
    }

    actions.update({ dispatch, getters: mockGetters })

    expect(dispatch.args).toEqual([
      ['chat/getNewMessages']
    ])
  })

  it('should commit nothing if is not logged', () => {
    const dispatch = sinon.spy(() => ({ catch: () => {} })) // also mock `catch` attr
    const mockGetters = {
      isLogged: false
    }

    actions.update({ dispatch, getters: mockGetters })

    expect(dispatch.args).toEqual([])
  })

  it('should update state when login success', async () => {
    const { address, balance, passphrase, publicKey, privateKey } = fakeData

    // mock & replace `loginOrRegister` dependency
    storeModule.__Rewire__('loginOrRegister', (passphrase) => Promise.resolve({
      address,
      balance,
      publicKey,
      privateKey
    }))

    const commit = sinon.spy()
    const dispatch = sinon.spy()

    await actions.login({ commit, dispatch }, passphrase)

    expect(commit.args).toEqual([
      ['setAddress', address],
      ['setBalance', balance],
      ['setPassphrase', passphrase],
      ['setPublicKey', publicKey],
      ['setPrivateKey', privateKey]
    ])
    expect(dispatch.args).toEqual([
      ['afterLogin', passphrase],
      ['contacts/fetchContacts', null, true]
    ])
  })

  it('should reset state when logout', () => {
    const dispatch = jest.fn()

    actions.logout({ dispatch })

    expect(dispatch).toHaveBeenCalledWith('reset')
  })
})
