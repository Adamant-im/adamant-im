import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('ecpair', () => ({
  ECPairFactory: () => ({})
}))

vi.mock('tiny-secp256k1', () => ({}))

vi.mock('@/lib/bitcoin/btc-base-api', () => ({
  default: class BtcBaseApiStub {
    constructor() {
      this.address = 'dash-address'
      this.multiplier = 1e8
    }
  },
  getUnique: (v) => v
}))

// Breaks the transitive import cycle: this module imports `@/store`
vi.mock('@/lib/store-crypto-address', () => ({
  storeCryptoAddress: vi.fn(),
  validateStoredCryptoAddresses: vi.fn(),
  flushCryptoAddresses: vi.fn()
}))

const getTransactionsMock = vi.fn()

vi.mock('@/lib/bitcoin/dash-api', () => ({
  default: class DashApiStub {
    getTransactions(options) {
      return getTransactionsMock(options)
    }
  }
}))

import actions from '../dash-actions'

function createContext() {
  return {
    state: { crypto: 'DASH', address: 'dash-address', transactions: {}, bottomReached: false },
    getters: {},
    commit: vi.fn(),
    dispatch: vi.fn(() => Promise.resolve())
  }
}

describe('dash-actions', () => {
  let context

  beforeEach(async () => {
    vi.clearAllMocks()
    context = createContext()
    await actions.afterLogin.handler(context, 'passphrase')
  })

  it('resets the recent loading flag when the request fails', async () => {
    getTransactionsMock.mockRejectedValue(new Error('all nodes offline'))

    await expect(actions.getNewTransactions(context)).rejects.toThrow('all nodes offline')

    expect(context.commit).toHaveBeenLastCalledWith('areRecentLoading', false)
  })

  it('resets the older loading flag when the request fails', async () => {
    getTransactionsMock.mockRejectedValue(new Error('all nodes offline'))

    await expect(actions.getOldTransactions(context)).rejects.toThrow('all nodes offline')

    expect(context.commit).toHaveBeenLastCalledWith('areOlderLoading', false)
  })

  it('stores the transactions it receives', async () => {
    getTransactionsMock.mockResolvedValue({ items: [{ hash: 'a' }] })

    await actions.getNewTransactions(context)

    expect(context.commit).toHaveBeenCalledWith('transactions', [{ hash: 'a' }])
  })
})
