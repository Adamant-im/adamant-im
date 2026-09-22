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

let getTransactionsViaMock = null
const getTransactionsMock = vi.fn()
const requestedWindows = []

/**
 * A fake network of indexers, each with its own newest-first list. Tests replace
 * `network.nodes` and choose which one serves a walk through `network.pick`.
 */
const network = {
  nodes: [],
  pick: () => network.nodes[0],
  generation: 0,
  onWalkFail: null
}

vi.mock('@/lib/nodes', () => {
  let pinnedUrl = null

  const sessionFor = (node) => ({
    node: node.url,
    generation: network.generation ?? 0,
    list: node.list
  })

  return {
    dogeIndexer: {
      // Mirrors the real client: every request of one walk gets the same node
      walkHistory: async (walk) => {
        while (true) {
          const node = network.pick()
          pinnedUrl = node.url
          try {
            return await walk(sessionFor(node))
          } catch (error) {
            if (network.onWalkFail) {
              network.generation = (network.generation ?? 0) + 1
              network.onWalkFail(error, node)
              continue
            }
            throw error
          }
        }
      },
      getHistoryNodeUrl: () => {
        const pinned = network.nodes.find((n) => n.url === pinnedUrl)
        return pinned?.offline ? undefined : pinned?.url
      },
      getHistorySessionGeneration: () => network.generation ?? 0,
      resetHistorySession: () => {
        pinnedUrl = null
        network.generation = (network.generation ?? 0) + 1
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
    getTransactionsVia(session, options = {}) {
      if (getTransactionsViaMock) {
        return getTransactionsViaMock(session, options)
      }
      const { from = 0, to = from + 20 } = options
      requestedWindows.push({ node: session.node, generation: session.generation, from, to })

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
    bottomReached: false,
    oldTxState: null
  }

  return {
    state,
    getters: {},
    commit: vi.fn((type, payload) => {
      if (type === 'transactions') {
        for (const tx of payload) state.transactions[tx.hash] = tx
      }
      if (type === 'bottom') state.bottomReached = payload
      if (type === 'oldTxState') state.oldTxState = payload
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

function setOffset(context, offset, node = network.nodes[0].url) {
  context.state.oldTxState = { node, generation: network.generation, offset }
}

describe('doge-actions getOldTransactions', () => {
  let context

  beforeEach(async () => {
    vi.clearAllMocks()
    requestedWindows.length = 0
    getTransactionsViaMock = null
    network.generation = 0
    network.onWalkFail = null
    network.nodes = [{ url: 'https://indexer.example.com', list: makeList(100) }]
    network.pick = () => network.nodes[0]
    context = createContext()
    await actions.afterLogin.handler(context, 'passphrase')
  })

  it('does not derive a raw node offset from merged store transactions', async () => {
    // These records have no proven positional relationship to the serving node:
    // some may be local, dropped, or loaded from another indexer.
    Object.assign(context.state.transactions, {
      tx0000: makeTx('tx0000'),
      tx0001: makeTx('tx0001'),
      registered: makeTx('registered', 'REGISTERED'),
      pending: makeTx('pending', 'PENDING'),
      rejected: makeTx('rejected', 'REJECTED')
    })

    await actions.getOldTransactions(context)

    expect(requestedWindows[0]).toMatchObject({ from: 0, to: CHUNK_SIZE })
  })

  it('re-reads an overlap in front of every window', async () => {
    preload(context, network.nodes[0].list, 40)
    setOffset(context, 40)

    await actions.getOldTransactions(context)

    expect(requestedWindows[0]).toMatchObject({ from: 40 - OFFSET_OVERLAP, to: 40 + CHUNK_SIZE })
    expect(Object.keys(context.state.transactions)).toHaveLength(60)
  })

  it('preserves pinned node across successive windows and resets offset to 0 on failover', async () => {
    const list1 = makeList(60)
    const list2 = makeList(60)
    network.nodes = [
      { url: 'https://node-1.example.com', list: list1 },
      { url: 'https://node-2.example.com', list: list2 }
    ]
    network.pick = () => network.nodes[0]

    // Successive actions on node 1 preserve the pinned node and advance offset
    await actions.getOldTransactions(context)
    expect(requestedWindows[0]).toMatchObject({
      node: 'https://node-1.example.com',
      from: 0,
      to: CHUNK_SIZE
    })

    await actions.getOldTransactions(context)
    expect(requestedWindows[1]).toMatchObject({
      node: 'https://node-1.example.com',
      from: CHUNK_SIZE - OFFSET_OVERLAP,
      to: CHUNK_SIZE * 2
    })

    // Node 1 becomes unavailable, advancing generation and failing over to node 2
    network.nodes[0].offline = true
    network.generation += 1
    network.pick = () => network.nodes[1]

    await actions.getOldTransactions(context)

    // Replacement node starts from 0 despite transactions already in store
    expect(requestedWindows[2]).toMatchObject({
      node: 'https://node-2.example.com',
      from: 0,
      to: CHUNK_SIZE
    })
    expect(context.state.bottomReached).toBe(false)
  })

  it('tolerates a record the indexer flags as a double spend inside the overlap', async () => {
    // `_mapTransaction` maps such a record to `undefined`: it takes a position in
    // this node's list but never reaches the store. Production has one on a node
    const reference = makeList(100)
    const listed = [...reference.slice(0, 22), undefined, ...reference.slice(22)]
    network.nodes = [{ url: 'https://flagged.example.com', list: listed }]
    preload(context, reference, 27)
    setOffset(context, 27, network.nodes[0].url)

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
    setOffset(context, 40, network.nodes[0].url)

    await actions.getOldTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(40)
    expect(context.state.bottomReached).toBe(false)
    expect(context.state.oldTxState).toMatchObject({ offset: 0 })

    // The next scroll restarts safely from this node's head and makes progress.
    await actions.getOldTransactions(context)
    expect(requestedWindows[1]).toMatchObject({ from: 0, to: CHUNK_SIZE })
    expect(Object.keys(context.state.transactions)).toHaveLength(50)
  })

  it('latches the bottom when the serving indexer runs out without querying other nodes', async () => {
    const full = makeList(484)
    const otherNodeSpy = vi.fn()
    network.nodes = [
      { url: 'https://shallow.example.com', list: full.slice(0, 50) },
      {
        url: 'https://full.example.com',
        get list() {
          otherNodeSpy()
          return full
        }
      }
    ]
    preload(context, full, 40)
    setOffset(context, 40, network.nodes[0].url)

    // Every window lands on the shallow node, which runs out after 50 records
    network.pick = () => network.nodes[0]
    for (let page = 0; page < 60 && !context.state.bottomReached; page++) {
      await actions.getOldTransactions(context)
    }

    expect(Object.keys(context.state.transactions)).toHaveLength(50)
    expect(context.state.bottomReached).toBe(true)
    expect(otherNodeSpy).not.toHaveBeenCalled()
  })

  it('latches the bottom when the end of history is reached', async () => {
    const list = makeList(30)
    network.nodes = [{ url: 'https://node-1.example.com', list }]
    preload(context, list, 20)
    setOffset(context, 20, network.nodes[0].url)

    await actions.getOldTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(30)
    expect(context.state.bottomReached).toBe(true)
  })

  it('does not set bottom while more pages remain', async () => {
    preload(context, network.nodes[0].list, 20)
    setOffset(context, 20)

    await actions.getOldTransactions(context)

    expect(context.state.bottomReached).toBe(false)
  })

  it('binds an empty replacement result so the bottom latch does not reopen repeatedly', async () => {
    const nodeA = { url: 'https://node-a.example.com', list: makeList(5) }
    const nodeB = { url: 'https://node-b.example.com', list: [] }
    network.nodes = [nodeA, nodeB]
    network.pick = () => nodeA

    await actions.getOldTransactions(context)
    expect(context.state.bottomReached).toBe(true)

    nodeA.offline = true
    network.generation += 1
    network.pick = () => nodeB

    await actions.getOldTransactions(context)

    expect(context.state.oldTxState).toEqual({
      node: nodeB.url,
      generation: network.generation,
      offset: 0
    })
    expect(context.state.bottomReached).toBe(true)

    await actions.getOldTransactions(context)
    expect(requestedWindows).toHaveLength(2)
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
    requestedWindows.length = 0
    getTransactionsViaMock = null
    network.generation = 0
    network.onWalkFail = null
    network.nodes = [{ url: 'https://indexer.example.com', list: makeList(100) }]
    network.pick = () => network.nodes[0]
    context = createContext()
    await actions.afterLogin.handler(context, 'passphrase')
  })

  it('resets the loading flag when the request fails', async () => {
    getTransactionsViaMock = vi.fn().mockRejectedValue(new Error('all indexers offline'))

    await expect(actions.getNewTransactions(context)).rejects.toThrow('all indexers offline')

    expect(context.commit).toHaveBeenLastCalledWith('areRecentLoading', false)
  })
})
