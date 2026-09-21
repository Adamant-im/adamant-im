import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('ecpair', () => ({
  ECPairFactory: () => ({})
}))

vi.mock('tiny-secp256k1', () => ({}))

vi.mock('@/lib/bitcoin/btc-base-api', () => ({
  default: class BtcBaseApiStub {
    constructor() {
      this.address = 'doge-address'
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

vi.mock('@/lib/bitcoin/doge-api', () => ({
  default: class DogeApiStub {
    getTransactions(options) {
      return getTransactionsMock(options)
    }
  }
}))

import actions from '../doge-actions'

function createContext(transactions = {}) {
  return {
    state: {
      crypto: 'DOGE',
      address: 'doge-address',
      transactions,
      bottomReached: false
    },
    getters: {},
    commit: vi.fn(),
    dispatch: vi.fn(() => Promise.resolve())
  }
}

describe('doge-actions pagination', () => {
  let context

  beforeEach(async () => {
    vi.clearAllMocks()
    context = createContext()
    await actions.afterLogin.handler(context, 'passphrase')
  })

  it('computes the offset from confirmed transactions only', async () => {
    // Two confirmed + one locally created pending transaction:
    // the pending tx does not exist for the indexer and must not shift the offset
    Object.assign(context.state.transactions, {
      tx1: { hash: 'tx1', status: 'CONFIRMED' },
      tx2: { hash: 'tx2', status: 'REGISTERED' },
      pending: { hash: 'pending', status: 'PENDING' }
    })
    getTransactionsMock.mockResolvedValue({ hasMore: false, items: [] })

    await actions.getOldTransactions(context)

    expect(getTransactionsMock).toHaveBeenCalledWith({ from: 2 })
  })

  it('does not count a rejected local transaction in the offset', async () => {
    // A failed broadcast is stored as REJECTED; that hash never reaches the
    // indexer, so counting it would shift `from` and skip one real history item
    Object.assign(context.state.transactions, {
      tx1: { hash: 'tx1', status: 'CONFIRMED' },
      tx2: { hash: 'tx2', status: 'REGISTERED' },
      pending: { hash: 'pending', status: 'PENDING' },
      rejected: { hash: 'rejected', status: 'REJECTED' }
    })
    getTransactionsMock.mockResolvedValue({ hasMore: false, items: [] })

    await actions.getOldTransactions(context)

    expect(getTransactionsMock).toHaveBeenCalledWith({ from: 2 })
  })

  it('sets bottom when the indexer reports no more pages', async () => {
    getTransactionsMock.mockResolvedValue({ hasMore: false, items: [], totalItems: 0 })

    await actions.getOldTransactions(context)

    expect(context.commit).toHaveBeenCalledWith('bottom', true)
  })

  it('does not accept the end of history from a node that does not reach the offset', async () => {
    // 20 records already read from a deeper node; this one holds only 11, so its
    // `hasMore: false` is about its own dataset, not about the end of history
    Object.assign(
      context.state.transactions,
      Object.fromEntries(
        Array.from({ length: 20 }, (_, i) => [`tx${i}`, { hash: `tx${i}`, status: 'CONFIRMED' }])
      )
    )
    getTransactionsMock.mockResolvedValue({ hasMore: false, items: [], totalItems: 11 })

    await actions.getOldTransactions(context)

    expect(getTransactionsMock).toHaveBeenCalledWith({ from: 20 })
    expect(context.commit).not.toHaveBeenCalledWith('bottom', true)
  })

  it('accepts the end of history from a node that reaches the offset', async () => {
    Object.assign(
      context.state.transactions,
      Object.fromEntries(
        Array.from({ length: 20 }, (_, i) => [`tx${i}`, { hash: `tx${i}`, status: 'CONFIRMED' }])
      )
    )
    getTransactionsMock.mockResolvedValue({ hasMore: false, items: [], totalItems: 20 })

    await actions.getOldTransactions(context)

    expect(context.commit).toHaveBeenCalledWith('bottom', true)
  })

  it('does not set bottom while more pages remain', async () => {
    getTransactionsMock.mockResolvedValue({ hasMore: true, items: [{}] })

    await actions.getOldTransactions(context)

    expect(context.commit).not.toHaveBeenCalledWith('bottom', true)
  })

  it('skips fetching when bottom has already been reached', async () => {
    context.state.bottomReached = true

    await actions.getOldTransactions(context)

    expect(getTransactionsMock).not.toHaveBeenCalled()
  })
})
