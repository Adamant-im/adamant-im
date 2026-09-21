import { beforeEach, describe, expect, it, vi } from 'vitest'

const getTransactionsMock = vi.fn()

vi.mock('@/lib/nodes', () => {
  const session = {
    node: 'https://indexer.example.com',
    getTransactions: (...args) => getTransactionsMock(...args)
  }

  return {
    btcIndexer: {
      ...session,
      // Mirrors the real client: every page of one walk gets the same node
      walkHistory: (walk) => walk(session)
    }
  }
})

vi.mock('ecpair', () => ({
  ECPairFactory: () => ({})
}))

vi.mock('tiny-secp256k1', () => ({}))

vi.mock('@/lib/bitcoin/btc-base-api', () => ({
  default: class BtcBaseApiStub {
    constructor() {
      this.address = 'btc-address'
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

vi.mock('../../../lib/bitcoin/bitcoin-api', () => ({
  default: class BtcApiStub {
    constructor() {
      this.address = 'btc-address'
    }
  }
}))

import actions from '../btc-actions'

const TX_CHUNK_SIZE = 25

/**
 * Builds a Vuex-like context stub
 */
function createContext(transactions = {}) {
  const committed = []
  const state = {
    address: 'btc-address',
    transactions,
    bottomReached: false,
    newTxCatchUp: null
  }

  return {
    state,
    committed,
    getters: {
      get sortedTransactions() {
        return Object.values(transactions).sort((a, b) => b.timestamp - a.timestamp)
      }
    },
    commit(type, payload) {
      committed.push([type, payload])
      if (type === 'transactions') {
        for (const tx of payload) {
          transactions[tx.hash] = tx
        }
      }
      if (type === 'newTxCatchUp') {
        state.newTxCatchUp = payload
      }
    },
    dispatch: vi.fn(() => Promise.resolve())
  }
}

/**
 * The shape `normalizeTransaction` actually produces: `id` and `hash`, and no
 * `txid`. Indexer-visible by default, since that is what a history page contains
 */
function makeTx(hash, timestamp, status = 'CONFIRMED') {
  return {
    id: hash,
    hash,
    timestamp,
    time: Math.floor(timestamp / 1000),
    status,
    direction: 'to',
    senderId: 'someone-else',
    recipientId: 'btc-address',
    amount: 1,
    fee: 0.0001,
    confirmations: status === 'CONFIRMED' ? 3 : 0,
    height: 100
  }
}

describe('btc-actions pagination', () => {
  let context

  beforeEach(async () => {
    vi.clearAllMocks()
    context = createContext()
    await actions.afterLogin.handler(context, 'passphrase')
  })

  it('stops fetching older transactions once bottom is reached', async () => {
    Object.assign(context.state.transactions, { a: makeTx('a', 3) })
    context.state.bottomReached = true

    await actions.getOldTransactions(context)

    expect(getTransactionsMock).not.toHaveBeenCalled()
  })

  it('uses the oldest txid as cursor for the next page', async () => {
    Object.assign(context.state.transactions, { a: makeTx('a', 3) })
    getTransactionsMock.mockResolvedValue([makeTx('b', 2), makeTx('c', 1)])

    await actions.getOldTransactions(context)

    expect(getTransactionsMock).toHaveBeenCalledWith('btc-address', 'a')
  })

  it('does not recurse when an empty page is returned', async () => {
    // Latest locally known tx is unknown to the chain: previous implementation
    // would repeat the same request forever
    Object.assign(context.state.transactions, { a: makeTx('a', 10) })
    getTransactionsMock.mockResolvedValue([])

    await actions.getNewTransactions(context)

    expect(getTransactionsMock).toHaveBeenCalledTimes(1)
  })

  it('does not repeat the same request when the cursor does not advance', async () => {
    // The chain returns pages that never include the latest local tx: without
    // the cursor guard this would loop forever
    Object.assign(context.state.transactions, { a: makeTx('a', 10) })
    const pages = [[makeTx('x1', 9), makeTx('x2', 8)], [makeTx('x3', 7), makeTx('x4', 6)], []]
    let call = 0
    getTransactionsMock.mockImplementation(() => Promise.resolve(pages[call++]))

    await actions.getNewTransactions(context)

    // After both distinct pages are consumed the cursor stops advancing
    expect(getTransactionsMock.mock.calls.map((c) => c[1])).toEqual([undefined, 'x2', 'x4'])
  })

  it('breaks out of a multi-cursor page cycle', async () => {
    // The node alternates between two pages: neither cursor equals the
    // immediately preceding one, so a one-step guard would never fire
    Object.assign(context.state.transactions, { a: makeTx('a', 10) })
    const pageA = [makeTx('x1', 9), makeTx('A', 8)]
    const pageB = [makeTx('x2', 7), makeTx('B', 6)]
    let call = 0
    getTransactionsMock.mockImplementation(() => {
      call += 1
      // undefined -> A -> B -> A -> B ...
      return Promise.resolve(call % 2 === 1 ? pageA : pageB)
    })

    await actions.getNewTransactions(context)

    // First page, then cursor A, then cursor B, then A is recognized as visited
    expect(getTransactionsMock.mock.calls.map((c) => c[1])).toEqual([undefined, 'A', 'B'])
  })

  it('bounds the walk when every page brings a fresh cursor', async () => {
    // Nothing repeats and the local tx never shows up: only the page cap stops it
    Object.assign(context.state.transactions, { a: makeTx('a', 1000) })
    let call = 0
    getTransactionsMock.mockImplementation(() => {
      call += 1
      return Promise.resolve([makeTx(`x${call}`, 100 - call), makeTx(`cursor${call}`, 99 - call)])
    })

    await actions.getNewTransactions(context)

    expect(getTransactionsMock).toHaveBeenCalledTimes(20)
  })

  it('continues an interrupted walk instead of restarting it', async () => {
    // 525 new transactions above the known one: more than the page cap allows,
    // so the walk must resume from its own cursor on the next refresh
    const known = makeTx('known', 0)
    Object.assign(context.state.transactions, { known })

    const chain = [...Array.from({ length: 525 }, (_, i) => makeTx(`new${i}`, 1000 - i)), known]
    // The indexer pages by "everything older than this txid"
    getTransactionsMock.mockImplementation((_address, toTx) => {
      const start = toTx ? chain.findIndex((tx) => tx.hash === toTx) + 1 : 0
      return Promise.resolve(chain.slice(start, start + TX_CHUNK_SIZE))
    })

    await actions.getNewTransactions(context)

    // Interrupted by the cap, with the resume point kept
    expect(context.state.newTxCatchUp).toMatchObject({
      target: 'known',
      node: 'https://indexer.example.com'
    })
    expect(Object.keys(context.state.transactions).length).toBeLessThan(chain.length)

    // The pages already fetched are the newest ones, so recomputing the target
    // would end the next walk immediately and leave the gap open forever
    for (let run = 0; run < 5; run++) {
      await actions.getNewTransactions(context)
    }

    expect(context.state.newTxCatchUp).toBe(null)
    expect(Object.keys(context.state.transactions)).toHaveLength(chain.length)
  })

  it('pages older history with the normalized identifier', async () => {
    // `normalizeTransaction` produces `hash`, never `txid`: reading the wrong
    // field left the cursor undefined and refetched the newest page forever
    Object.assign(context.state.transactions, {
      new1: makeTx('new1', 3000),
      old1: makeTx('old1', 1000)
    })
    getTransactionsMock.mockResolvedValue([])

    await actions.getOldTransactions(context)

    expect(getTransactionsMock).toHaveBeenCalledWith('btc-address', 'old1')
  })

  it('walks past the first page towards the known transaction', async () => {
    const known = makeTx('known', 0)
    Object.assign(context.state.transactions, { known })

    const chain = [...Array.from({ length: 40 }, (_, i) => makeTx(`new${i}`, 5000 - i)), known]
    getTransactionsMock.mockImplementation((_address, toTx) => {
      const start = toTx ? chain.findIndex((tx) => tx.hash === toTx) + 1 : 0
      return Promise.resolve(chain.slice(start, start + TX_CHUNK_SIZE))
    })

    await actions.getNewTransactions(context)

    // Two pages: the cursor is the oldest hash of the first one
    expect(getTransactionsMock.mock.calls.map((c) => c[1])).toEqual([undefined, 'new24'])
    expect(Object.keys(context.state.transactions)).toHaveLength(chain.length)
  })

  it('ignores a catch-up cursor left by a different indexer', async () => {
    const known = makeTx('known', 0)
    Object.assign(context.state.transactions, { known })
    context.state.newTxCatchUp = {
      target: 'gone',
      cursor: 'unknown-to-this-node',
      node: 'https://other.example.com'
    }

    getTransactionsMock.mockResolvedValue([makeTx('fresh', 10), known])

    await actions.getNewTransactions(context)

    // Started over on this node instead of continuing a foreign cursor
    expect(getTransactionsMock).toHaveBeenCalledWith('btc-address', undefined)
    expect(context.state.newTxCatchUp).toBe(null)
  })

  it('ignores a local pending transaction when picking the walk target', async () => {
    // A just-sent transfer is the newest record but no page can ever contain it
    Object.assign(context.state.transactions, {
      confirmed: makeTx('confirmed', 5),
      pending: makeTx('pending', 10, 'PENDING'),
      rejected: makeTx('rejected', 9, 'REJECTED')
    })
    getTransactionsMock.mockResolvedValue([makeTx('fresh', 6), makeTx('confirmed', 5)])

    await actions.getNewTransactions(context)

    // One page: it contains the newest indexed transaction, so history is continuous
    expect(getTransactionsMock).toHaveBeenCalledTimes(1)
    expect(context.state.newTxCatchUp).toBe(null)
  })
})
