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
      password: '',
      IDBReady: false,
      publicKeys: {}
    })
  })

  it('should update state when login success', async () => {
    const { address, balance, passphrase } = fakeData

    // mock & replace `loginOrRegister` dependency
    storeModule.__Rewire__('loginOrRegister', (passphrase) =>
      Promise.resolve({
        address,
        balance
      })
    )

    const commit = sinon.spy()
    const dispatch = sinon.spy()

    await actions.login({ commit, dispatch }, passphrase)

    expect(commit.args).toEqual([
      ['setAddress', address],
      ['setBalance', balance],
      ['setPassphrase', passphrase]
    ])
    expect(dispatch.args).toEqual([['reset'], ['afterLogin', passphrase]])
  })

  it('should reset state when logout', () => {
    const dispatch = jest.fn()

    actions.logout({ dispatch })

    expect(dispatch).toHaveBeenCalledWith('reset')
  })
})
