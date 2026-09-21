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
const requestedWindows = []

/**
 * A fake network of indexers, each with its own newest-first list. Tests replace
 * `network.nodes` and choose which one serves a walk through `network.pick`.
 */
const network = {
  nodes: [],
  pick: () => network.nodes[0]
}

vi.mock('@/lib/nodes', () => {
  const sessionFor = (node) => ({ node: node.url, list: node.list })

  return {
    dogeIndexer: {
      // Mirrors the real client: every request of one walk gets the same node
      walkHistory: (walk) => walk(sessionFor(network.pick())),
      // Mirrors `confirmOnOtherNodes`: `disabled` nodes do not count, `offline` ones abstain
      confirmHistoryEnd: async (excludedUrl, probe) => {
        const others = network.nodes.filter((n) => n.url !== excludedUrl && !n.disabled)
        if (others.length === 0) return true

        let answered = 0
        let abstained = 0
        for (const node of others) {
          if (node.offline) {
            abstained += 1
            continue
          }
          if (!(await probe(sessionFor(node)))) return false
          answered += 1
        }

        return answered > 0 && abstained === 0
      }
    }
  }
})

vi.mock('@/lib/bitcoin/doge-api', () => ({
  CHUNK_SIZE: 20,
  default: class DogeApiStub {
    getTransactions(options) {
      return getTransactionsMock(options)
    }

    /** Insight-style `from` / `to` window over the session node's own list */
    getTransactionsVia(session, { from = 0, to = from + 20 }) {
      requestedWindows.push({ node: session.node, from, to })

      return Promise.resolve({
        totalItems: session.list.length,
        hasMore: to < session.list.length,
        items: session.list.slice(from, to)
      })
    }
  }
}))

import actions from '../doge-actions'

const CHUNK_SIZE = 20
const OFFSET_OVERLAP = 5

function createContext(transactions = {}) {
  const state = {
    crypto: 'DOGE',
    address: 'doge-address',
    transactions,
    bottomReached: false
  }

  return {
    state,
    getters: {},
    commit: vi.fn((type, payload) => {
      if (type === 'transactions') {
        for (const tx of payload) state.transactions[tx.hash] = tx
      }
      if (type === 'bottom') state.bottomReached = payload
    }),
    dispatch: vi.fn(() => Promise.resolve())
  }
}

function makeTx(hash, status = 'CONFIRMED') {
  return { hash, id: hash, status }
}

function makeList(count) {
  return Array.from({ length: count }, (_, i) => makeTx(`tx${String(i).padStart(4, '0')}`))
}

/** Puts `count` records of `list` into the store, as earlier pages would have */
function preload(context, list, count) {
  for (const tx of list.slice(0, count)) context.state.transactions[tx.hash] = tx
}

describe('doge-actions getOldTransactions', () => {
  let context

  beforeEach(async () => {
    vi.clearAllMocks()
    requestedWindows.length = 0
    network.nodes = [{ url: 'https://indexer.example.com', list: makeList(100) }]
    network.pick = () => network.nodes[0]
    context = createContext()
    await actions.afterLogin.handler(context, 'passphrase')
  })

  it('derives the offset from confirmed transactions only', async () => {
    // A mempool record may be listed by one node and not another, or dropped;
    // local ones never reach the indexer: none of them may push the offset forward
    Object.assign(context.state.transactions, {
      tx0000: makeTx('tx0000'),
      tx0001: makeTx('tx0001'),
      registered: makeTx('registered', 'REGISTERED'),
      pending: makeTx('pending', 'PENDING'),
      rejected: makeTx('rejected', 'REJECTED')
    })

    await actions.getOldTransactions(context)

    // Two confirmed: the window re-reads the overlap before offset 2
    expect(requestedWindows[0]).toMatchObject({ from: 0, to: 2 + CHUNK_SIZE })
  })

  it('re-reads an overlap in front of every window', async () => {
    preload(context, network.nodes[0].list, 40)

    await actions.getOldTransactions(context)

    expect(requestedWindows[0]).toMatchObject({ from: 40 - OFFSET_OVERLAP, to: 40 + CHUNK_SIZE })
    expect(Object.keys(context.state.transactions)).toHaveLength(60)
  })

  it('loses nothing when indexers order and list records differently', async () => {
    // What production indexers really do: one node swaps records sharing a
    // timestamp and lists an extra one, so the same offset points at different
    // records on each node. Windows alternate between the two
    const reference = makeList(200)
    const divergent = [...reference]
    for (const at of [17, 38, 59, 80, 121, 162]) {
      ;[divergent[at], divergent[at + 1]] = [divergent[at + 1], divergent[at]]
    }
    divergent.splice(100, 0, makeTx('phantom'))

    network.nodes = [
      { url: 'https://node-1.example.com', list: divergent },
      { url: 'https://node-2.example.com', list: reference }
    ]
    let call = 0
    network.pick = () => network.nodes[call++ % 2]

    for (let page = 0; page < 30 && !context.state.bottomReached; page++) {
      await actions.getOldTransactions(context)
    }

    for (const tx of reference) {
      expect(context.state.transactions[tx.hash]).toBeDefined()
    }
    expect(context.state.bottomReached).toBe(true)
  })

  it('tolerates a record the indexer flags as a double spend inside the overlap', async () => {
    // `_mapTransaction` maps such a record to `undefined`: it takes a position in
    // this node's list but never reaches the store. Production has one on a node
    const reference = makeList(100)
    const listed = [...reference.slice(0, 22), undefined, ...reference.slice(22)]
    network.nodes = [{ url: 'https://flagged.example.com', list: listed }]
    preload(context, reference, 27)

    await expect(actions.getOldTransactions(context)).resolves.toBeUndefined()

    // The window starts at 22: the flagged record is its very first position
    expect(requestedWindows[0]).toMatchObject({ from: 27 - OFFSET_OVERLAP })
    expect(Object.keys(context.state.transactions)).toHaveLength(46)
    expect(context.state.transactions.undefined).toBeUndefined()
  })

  it('drops a window that does not reach back into the known history', async () => {
    // This node's list is shifted by far more than the overlap: its window would
    // start past records never read, and keeping it would bury that gap
    const list = makeList(100)
    preload(context, list, 40)
    network.nodes = [{ url: 'https://shifted.example.com', list: list.slice(30) }]

    await actions.getOldTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(40)
    expect(context.state.bottomReached).toBe(false)
  })

  it('does not latch the bottom from a shallower indexer while another has more', async () => {
    const full = makeList(484)
    network.nodes = [
      { url: 'https://full.example.com', list: full },
      { url: 'https://shallow.example.com', list: full.slice(0, 50) }
    ]
    preload(context, full, 40)

    // Every window lands on the shallow node, which runs out after 50 records
    network.pick = () => network.nodes[1]
    for (let page = 0; page < 60 && !context.state.bottomReached; page++) {
      await actions.getOldTransactions(context)
    }

    expect(Object.keys(context.state.transactions)).toHaveLength(484)
    expect(context.state.bottomReached).toBe(true)
  })

  it('does not latch the bottom while the full indexers are offline', async () => {
    const full = makeList(484)
    network.nodes = [
      { url: 'https://full.example.com', list: full, offline: true },
      { url: 'https://shallow.example.com', list: full.slice(0, 50) }
    ]
    network.pick = () => network.nodes[1]
    preload(context, full, 40)

    for (let page = 0; page < 5; page++) {
      await actions.getOldTransactions(context)
    }

    expect(context.state.bottomReached).toBe(false)
  })

  it('latches the bottom when every indexer agrees', async () => {
    const list = makeList(30)
    network.nodes = [
      { url: 'https://node-1.example.com', list },
      { url: 'https://node-2.example.com', list }
    ]
    preload(context, list, 20)

    await actions.getOldTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(30)
    expect(context.state.bottomReached).toBe(true)
  })

  it('does not set bottom while more pages remain', async () => {
    preload(context, network.nodes[0].list, 20)

    await actions.getOldTransactions(context)

    expect(context.state.bottomReached).toBe(false)
  })

  it('skips fetching when bottom has already been reached', async () => {
    context.state.bottomReached = true

    await actions.getOldTransactions(context)

    expect(requestedWindows).toHaveLength(0)
  })

  it('resets the loading flag when the walk fails', async () => {
    network.pick = () => {
      throw new Error('all indexers offline')
    }

    await expect(actions.getOldTransactions(context)).rejects.toThrow('all indexers offline')

    expect(context.commit).toHaveBeenLastCalledWith('areOlderLoading', false)
  })
})

describe('doge-actions getNewTransactions', () => {
  let context

  beforeEach(async () => {
    vi.clearAllMocks()
    context = createContext()
    await actions.afterLogin.handler(context, 'passphrase')
  })

  it('resets the loading flag when the request fails', async () => {
    getTransactionsMock.mockRejectedValue(new Error('all indexers offline'))

    await expect(actions.getNewTransactions(context)).rejects.toThrow('all indexers offline')

    expect(context.commit).toHaveBeenLastCalledWith('areRecentLoading', false)
  })
})
