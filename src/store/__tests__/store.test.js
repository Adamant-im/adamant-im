import { vi, describe, it, beforeEach, expect } from 'vitest'
import { loginOrRegister } from '@/lib/adamant-api'
const createRecursiveProxy = () => {
  const proxy = new Proxy(() => {}, {
    get: (target, prop) => {
      if (['map', 'forEach', 'filter', 'reduce'].includes(prop)) return () => []
      if (prop === 'list') return []
      if (prop === 'length') return 0
      return proxy
    },
    apply: () => proxy
  })
  return proxy
}

global.config = createRecursiveProxy()

// 2. Explicit mocks for all node files to avoid running their internal side effects
vi.mock('@/lib/nodes/eth/index', () => ({ eth: {}, default: { eth: {} } }))
vi.mock('@/lib/nodes/btc/index', () => ({ btc: {}, default: { btc: {} } }))
vi.mock('@/lib/nodes/dash/index', () => ({ dash: {}, default: { dash: {} } }))
vi.mock('@/lib/nodes/lsk/index', () => ({ lsk: {}, default: { lsk: {} } }))
vi.mock('@/lib/nodes/doge/index', () => ({ doge: {}, default: { doge: {} } }))
vi.mock('@/lib/nodes/bnb/index', () => ({ bnb: {}, default: { bnb: {} } }))
vi.mock('@/lib/nodes/eth-indexer/index', () => ({ ethIndexer: {}, default: { ethIndexer: {} } }))
vi.mock('@/lib/nodes/eth-indexer/index', () => ({ ethIndexer: {}, default: {} }))
vi.mock('@/lib/nodes/btc-indexer/index', () => ({ btcIndexer: {}, default: {} }))
vi.mock('@/lib/nodes/doge-indexer/index', () => ({ dogeIndexer: {}, default: {} }))

// Mock for ADM rate service (fixes the current test error)
vi.mock('@/lib/nodes/rate-info-service/index', () => ({
  rateInfoService: {},
  rateInfoClient: {},
  default: {}
}))

// 3. Shared mock for the nodes module
vi.mock('@/lib/nodes', () => {
  const createNodeMock = () => ({
    getNodes: () => [],
    onStatusUpdate: vi.fn(),
    useFastest: true,
    services: { infoService: { list: [] } }
  })

  const nodesMock = {
    adm: createNodeMock(),
    btc: createNodeMock(),
    eth: createNodeMock(),
    lsk: createNodeMock(),
    doge: createNodeMock(),
    dash: createNodeMock(),
    bnb: createNodeMock(),
    ipfs: createNodeMock()
  }

  return {
    nodes: nodesMock,
    default: nodesMock,
    ...nodesMock
  }
})

// 4. Remaining system mocks
vi.mock('@/lib/bitcoin/btc-base-api', () => ({ default: vi.fn(), getUnique: (v) => v }))
vi.mock('@/lib/idb/state', () => ({
  modules: [],
  restoreState: vi.fn(() => Promise.resolve()),
  saveState: vi.fn(() => Promise.resolve())
}))
vi.mock('/img/adamant-logo-transparent-512x512.png', () => ({ default: 'logo' }))
vi.mock('ecpair', () => ({ ECPairFactory: () => ({ fromSeed: vi.fn(), makeRandom: vi.fn() }) }))
vi.mock('tiny-secp256k1', () => ({}))

vi.mock('@/lib/nodes/services', () => {
  const createServiceClientMock = () => ({
    getNodes: () => [],
    onStatusUpdate: vi.fn(),
    useFastest: true
  })

  // Use Proxy so any requested service (RatesInfo, etc.)
  // has getNodes and onStatusUpdate methods
  const servicesProxy = new Proxy(
    {},
    {
      get: () => createServiceClientMock()
    }
  )

  return {
    services: servicesProxy,
    default: servicesProxy
  }
})

vi.mock('@/lib/adamant-api', () => ({
  loginOrRegister: vi.fn(),
  unlock: vi.fn(),
  getCurrentAccount: vi.fn()
}))

import { Base64 } from 'js-base64'
import storeModule, { store } from '@/store'

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

    // Configure mock behavior directly here instead of using __Rewire__
    vi.mocked(loginOrRegister).mockResolvedValue({
      address,
      balance
    })

    const commit = vi.fn()
    const dispatch = vi.fn()

    // Execute action
    await actions.login({ commit, dispatch }, passphrase)

    // Assertions remain the same
    expect(commit).toHaveBeenCalledWith('setAddress', address)
    expect(commit).toHaveBeenCalledWith('setBalance', balance)
    expect(commit).toHaveBeenCalledWith('setPassphrase', passphrase)

    expect(dispatch).toHaveBeenCalledWith('reset')
    expect(dispatch).toHaveBeenCalledWith('afterLogin', passphrase)
  })

  it('should reset state when logout', () => {
    const dispatch = vi.fn()
    const commit = vi.fn()

    actions.logout({ dispatch, commit })

    expect(dispatch).toHaveBeenCalledWith('reset')
    expect(commit).toHaveBeenCalledWith('options/resetAccountViewState', null, { root: true })
    expect(commit).toHaveBeenCalledWith('options/resetSettingsViewState', null, { root: true })
  })
})
