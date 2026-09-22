import { beforeEach, describe, expect, it, vi } from 'vitest'

const getTransactionsMock = vi.fn()

/**
 * A fake network of indexers. By default it is a single node served by
 * `getTransactionsMock`; tests that need several nodes with different chains
 * replace `network.nodes` and choose which one serves a walk via `network.pick`.
 */
const network = {
  nodes: [],
  pick: () => network.nodes[0]
}

function resetNetwork() {
  network.nodes = [{ url: 'https://indexer.example.com' }]
  network.pick = () => network.nodes[0]
  network.onWalkFail = null
  network.generation = 0
}

vi.mock('@/lib/nodes', () => {
  const sessionFor = (node) => ({
    node: node.url,
    generation: network.generation ?? 0,
    getTransactions: (address, toTx) =>
      node.getTransactions
        ? node.getTransactions(address, toTx)
        : getTransactionsMock(address, toTx, node.url)
  })

  let pinnedUrl = null

  return {
    btcIndexer: {
      // Mirrors the real client: every page of one walk gets the same node, and retries on failure
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
const MAX_NEW_TX_PAGES = 20

/**
 * Builds a Vuex-like context stub
 */
function createContext(transactions = {}) {
  const committed = []
  const state = {
    address: 'btc-address',
    transactions,
    bottomReached: false,
    newTxCatchUp: null,
    oldTxState: null
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
      if (type === 'bottom') {
        state.bottomReached = payload
      }
      if (type === 'oldTxState') {
        state.oldTxState = payload
      }
    },
    dispatch: vi.fn(() => Promise.resolve())
  }
}

/**
 * The shape `normalizeTransaction` actually produces: `id` and `hash`, and no
 * `txid`. Confirmed by default, since that is what most of a history consists of
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

/** `count` transactions, newest first */
function makeChain(prefix, count, newest = 100_000) {
  return Array.from({ length: count }, (_, i) => makeTx(`${prefix}${i}`, newest - i))
}

/**
 * Esplora-style paging over one node's chain: the first page, or the page after
 * `toTx`. A node that does not know `toTx` — a pruned one — answers empty
 */
function pagesOver(chain) {
  return (_address, toTx) => {
    if (!toTx) return Promise.resolve(chain.slice(0, TX_CHUNK_SIZE))

    const at = chain.findIndex((tx) => tx.hash === toTx)
    if (at < 0) return Promise.resolve([])

    return Promise.resolve(chain.slice(at + 1, at + 1 + TX_CHUNK_SIZE))
  }
}

function nodeOver(url, chain) {
  return { url, getTransactions: pagesOver(chain) }
}

describe('btc-actions getNewTransactions', () => {
  let context

  beforeEach(async () => {
    vi.clearAllMocks()
    resetNetwork()
    context = createContext()
    await actions.afterLogin.handler(context, 'passphrase')
  })

  it('walks past the first page towards the known transaction', async () => {
    const known = makeTx('known', 0)
    Object.assign(context.state.transactions, { known })

    const chain = [...makeChain('new', 40), known]
    getTransactionsMock.mockImplementation(pagesOver(chain))

    await actions.getNewTransactions(context)

    // Two pages: the cursor is the oldest hash of the first one
    expect(getTransactionsMock.mock.calls.map((c) => c[1])).toEqual([undefined, 'new24'])
    expect(Object.keys(context.state.transactions)).toHaveLength(chain.length)
    expect(context.state.newTxCatchUp).toBe(null)
  })

  it('continues an interrupted walk instead of restarting it', async () => {
    // 525 new transactions above the known one: more than the page cap allows,
    // so the walk must resume from its own cursor on the next refresh
    const known = makeTx('known', 0)
    Object.assign(context.state.transactions, { known })

    const chain = [...makeChain('new', 525), known]
    getTransactionsMock.mockImplementation(pagesOver(chain))

    await actions.getNewTransactions(context)

    // Interrupted by the cap, with the resume point kept
    expect(getTransactionsMock).toHaveBeenCalledTimes(MAX_NEW_TX_PAGES)
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

  it('keeps the target when the next refresh lands on another indexer', async () => {
    // node A -> page cap -> node B: only the cursor belongs to node A
    const known = makeTx('known', 0)
    Object.assign(context.state.transactions, { known })

    const chain = [...makeChain('new', 525), known]
    network.nodes = [
      nodeOver('https://node-a.example.com', chain),
      nodeOver('https://node-b.example.com', chain)
    ]

    network.pick = () => network.nodes[0]
    await actions.getNewTransactions(context)
    expect(context.state.newTxCatchUp).toMatchObject({
      target: 'known',
      node: 'https://node-a.example.com'
    })

    // Node B restarts from its own first page, walking towards the same target
    network.pick = () => network.nodes[1]
    for (let run = 0; run < 5 && context.state.newTxCatchUp; run++) {
      await actions.getNewTransactions(context)
    }

    expect(context.state.newTxCatchUp).toBe(null)
    expect(Object.keys(context.state.transactions)).toHaveLength(chain.length)
  })

  it('does not treat a cursor cycle as continuity', async () => {
    // The node alternates between two pages: neither cursor equals the
    // immediately preceding one, so a one-step guard would never fire
    Object.assign(context.state.transactions, { known: makeTx('known', 10) })
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
    // The target was never reached: it stays pending, and the next walk starts over
    expect(context.state.newTxCatchUp).toMatchObject({ target: 'known', cursor: undefined })
  })

  it('keeps the target pending when an indexer cycles and recovers on another indexer', async () => {
    const known = makeTx('known', 0)
    Object.assign(context.state.transactions, { known })
    const chain = [...makeChain('new', 30), known]

    const cycling = {
      url: 'https://cycling.example.com',
      // Always answers with the same page, whatever the cursor
      getTransactions: () => Promise.resolve(chain.slice(0, TX_CHUNK_SIZE))
    }
    network.nodes = [cycling, nodeOver('https://healthy.example.com', chain)]
    network.pick = () => cycling

    await actions.getNewTransactions(context)

    // Cycling node keeps the target pending without fanning out
    expect(context.state.newTxCatchUp).toMatchObject({
      target: 'known',
      node: cycling.url,
      exhausted: true
    })

    // On failover to healthy node, continuity is restored
    network.pick = () => network.nodes[1]
    await actions.getNewTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(chain.length)
    expect(context.state.newTxCatchUp).toBe(null)
  })

  it('keeps the target pending when a pruned indexer runs out and recovers on a full indexer', async () => {
    const known = makeTx('known', 0)
    Object.assign(context.state.transactions, { known })
    const chain = [...makeChain('new', 60), known]

    // Keeps only the newest 30: its history ends long before the known record
    network.nodes = [
      nodeOver('https://pruned.example.com', chain.slice(0, 30)),
      nodeOver('https://full.example.com', chain)
    ]
    network.pick = () => network.nodes[0]

    await actions.getNewTransactions(context)

    expect(context.state.newTxCatchUp).toMatchObject({
      target: 'known',
      node: 'https://pruned.example.com',
      exhausted: true
    })
    expect(Object.keys(context.state.transactions)).toHaveLength(31)

    // On failover to full node, full chain is loaded
    network.pick = () => network.nodes[1]
    await actions.getNewTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(chain.length)
    expect(context.state.newTxCatchUp).toBe(null)
  })

  it('does not repeat the full network walk on consecutive refreshes when history is exhausted', async () => {
    const known = makeTx('known', 0)
    Object.assign(context.state.transactions, { known })
    const chain = makeChain('new', 30) // 30 records; 'known' is absent (reorg or pruned)

    let requestCount = 0
    const node = {
      url: 'https://indexer.example.com',
      getTransactions: (address, toTx) => {
        requestCount += 1
        return pagesOver(chain)(address, toTx)
      }
    }
    network.nodes = [node]
    network.pick = () => node

    // First refresh: walks through chain (2 pages of 25 + 5, then empty page = 3 requests)
    await actions.getNewTransactions(context)
    const requestsAfterFirstRefresh = requestCount
    expect(requestsAfterFirstRefresh).toBe(3)
    expect(context.state.newTxCatchUp).toMatchObject({
      target: 'known',
      node: node.url,
      exhausted: true
    })

    // Second consecutive refresh on the same node:
    await actions.getNewTransactions(context)
    const requestsOnSecondRefresh = requestCount - requestsAfterFirstRefresh

    // The second refresh checks only the head (1 request) rather than repeating the full 3-request walk
    expect(requestsOnSecondRefresh).toBe(1)
    expect(context.state.newTxCatchUp).toMatchObject({
      target: 'known',
      node: node.url,
      exhausted: true
    })
  })

  it('keeps the continuity gap pending when indexers are pruned and recovers on a full indexer', async () => {
    const known = makeTx('known', 0)
    Object.assign(context.state.transactions, { known })
    const chain = [...makeChain('new', 60), known]

    // Both indexers initially expose only the newest 30
    network.nodes = [
      nodeOver('https://pruned-a.example.com', chain.slice(0, 30)),
      nodeOver('https://pruned-b.example.com', chain.slice(0, 30))
    ]

    await actions.getNewTransactions(context)

    // Continuity gap stays pending; target is NOT abandoned as a reorg
    expect(context.state.newTxCatchUp).toMatchObject({ target: 'known' })
    expect(Object.keys(context.state.transactions)).toHaveLength(31)

    // One indexer is restored to the full chain
    network.nodes[1] = nodeOver('https://full-b.example.com', chain)
    network.pick = () => network.nodes[1]

    await actions.getNewTransactions(context)

    // Continuity is restored across all 61 records
    expect(context.state.newTxCatchUp).toBe(null)
    expect(Object.keys(context.state.transactions)).toHaveLength(chain.length)
  })

  it('bounds the walk when every page brings a fresh cursor', async () => {
    // Nothing repeats and the local tx never shows up: only the page cap stops it
    Object.assign(context.state.transactions, { known: makeTx('known', 0) })
    let call = 0
    getTransactionsMock.mockImplementation(() => {
      call += 1
      return Promise.resolve([
        makeTx(`x${call}`, 100_000 - call * 2),
        makeTx(`cursor${call}`, 99_999 - call * 2)
      ])
    })

    await actions.getNewTransactions(context)

    expect(getTransactionsMock).toHaveBeenCalledTimes(MAX_NEW_TX_PAGES)
  })

  it('targets the newest confirmed transaction', async () => {
    // A just-sent transfer is the newest record but no page contains it, and a
    // mempool one may still be dropped: neither can prove continuity
    Object.assign(context.state.transactions, {
      confirmed: makeTx('confirmed', 5),
      registered: makeTx('registered', 8, 'REGISTERED'),
      pending: makeTx('pending', 10, 'PENDING'),
      rejected: makeTx('rejected', 9, 'REJECTED')
    })
    getTransactionsMock.mockResolvedValue([makeTx('fresh', 6), makeTx('confirmed', 5)])

    await actions.getNewTransactions(context)

    // One page: it contains the newest confirmed transaction, so history is continuous
    expect(getTransactionsMock).toHaveBeenCalledTimes(1)
    expect(context.state.newTxCatchUp).toBe(null)
  })

  it('resets the loading flag when the walk fails', async () => {
    getTransactionsMock.mockRejectedValue(new Error('all indexers offline'))

    await expect(actions.getNewTransactions(context)).rejects.toThrow('all indexers offline')

    expect(context.committed.at(-1)).toEqual(['areRecentLoading', false])
  })

  it('preserves the original continuity target across an automatic retry when node A commits a page and fails', async () => {
    const known = makeTx('known', 0)
    Object.assign(context.state.transactions, { known })

    // 40 new transactions, followed by 'known'
    const chain = [...makeChain('new', 40), known]

    const nodeAUrl = 'https://node-a.example.com'
    const nodeBUrl = 'https://node-b.example.com'

    // Node A returns the first page (25 txs), but fails on the second page
    const nodeA = {
      url: nodeAUrl,
      getTransactions: (_address, toTx) => {
        if (!toTx) {
          return Promise.resolve(chain.slice(0, TX_CHUNK_SIZE))
        }
        return Promise.reject(new Error('connection timeout'))
      }
    }

    // Node B has the entire chain and responds normally
    const nodeB = nodeOver(nodeBUrl, chain)

    network.nodes = [nodeA, nodeB]
    network.pick = () => network.nodes[0]
    network.onWalkFail = (_err, failedNode) => {
      expect(failedNode.url).toBe(nodeAUrl)
      network.pick = () => nodeB
    }

    await actions.getNewTransactions(context)

    // Node B must have restarted from the top down to 'known' (the pre-walk target),
    // loading all 41 records and closing the continuity gap.
    expect(context.state.newTxCatchUp).toBe(null)
    expect(Object.keys(context.state.transactions)).toHaveLength(41)
    for (const tx of chain) {
      expect(context.state.transactions[tx.hash]).toBeDefined()
    }
  })

  it('preserves exhausted gap state and head target across multi-tick head catch-up exceeding 500 new transactions', async () => {
    const head0 = makeTx('head-0', 1000)
    Object.assign(context.state.transactions, { 'head-0': head0 })

    // Exhausted mode: node previously ran out of history without finding 'missing-old-gap'
    context.state.newTxCatchUp = {
      target: 'missing-old-gap',
      cursor: undefined,
      node: 'https://indexer.example.com',
      exhausted: true
    }

    // 525 new transactions arrive above head-0
    const newTxs = makeChain('fresh', 525, 600_000)
    const fullChain = [...newTxs, head0]

    network.nodes = [nodeOver('https://indexer.example.com', fullChain)]
    network.pick = () => network.nodes[0]

    // Tick 1: retrieves 20 pages * 25 = 500 transactions, hitting budget
    await actions.getNewTransactions(context)

    expect(context.state.newTxCatchUp).toMatchObject({
      target: 'missing-old-gap',
      headTarget: 'head-0',
      cursor: 'fresh499',
      node: 'https://indexer.example.com',
      exhausted: true
    })
    expect(Object.keys(context.state.transactions)).toHaveLength(501) // 500 fresh + head-0

    // Tick 2: resumes head catch-up from cursor, completes head catch-up without re-entering historical gap
    await actions.getNewTransactions(context)

    expect(context.state.newTxCatchUp).toEqual({
      target: 'missing-old-gap',
      cursor: undefined,
      node: 'https://indexer.example.com',
      exhausted: true
    })
    expect(Object.keys(context.state.transactions)).toHaveLength(526) // all 525 fresh + head-0

    // Tick 3: subsequent refresh on this exhausted node checks only the head (1 request) and does not scan for missing-old-gap
    let tick3Calls = 0
    const countingNode = {
      url: 'https://indexer.example.com',
      getTransactions: (_address, toTx) => {
        tick3Calls += 1
        return pagesOver(fullChain)(_address, toTx)
      }
    }
    network.nodes = [countingNode]
    network.pick = () => countingNode

    await actions.getNewTransactions(context)
    expect(tick3Calls).toBe(1)
    expect(context.state.newTxCatchUp).toEqual({
      target: 'missing-old-gap',
      cursor: undefined,
      node: 'https://indexer.example.com',
      exhausted: true
    })
  })
})

describe('btc-actions getOldTransactions', () => {
  let context

  beforeEach(async () => {
    vi.clearAllMocks()
    resetNetwork()
    context = createContext()
    await actions.afterLogin.handler(context, 'passphrase')
  })

  it('stops fetching older transactions once bottom is reached', async () => {
    Object.assign(context.state.transactions, { a: makeTx('a', 3) })
    context.state.bottomReached = true

    await actions.getOldTransactions(context)

    expect(getTransactionsMock).not.toHaveBeenCalled()
  })

  it('establishes a node-local cursor before paging by the normalized identifier', async () => {
    const chain = makeChain('tx', 30)
    getTransactionsMock.mockImplementation(pagesOver(chain))

    await actions.getOldTransactions(context)
    await actions.getOldTransactions(context)

    // The merged store cannot provide a safe first cursor. Once the first page
    // establishes provenance, the normalized `hash` owns the next request.
    expect(getTransactionsMock.mock.calls.map((call) => call[1])).toEqual([undefined, 'tx24'])
  })

  it('latches the bottom when the serving indexer runs out without querying other nodes', async () => {
    const chain = makeChain('tx', 141)
    const otherNodeSpy = vi.fn()
    network.nodes = [
      nodeOver('https://pruned.example.com', chain.slice(0, 30)),
      {
        url: 'https://full.example.com',
        getTransactions: (...args) => {
          otherNodeSpy(...args)
          return nodeOver('https://full.example.com', chain).getTransactions(...args)
        }
      }
    ]

    // The newest page came from a full node...
    Object.assign(
      context.state.transactions,
      Object.fromEntries(chain.slice(0, TX_CHUNK_SIZE).map((tx) => [tx.hash, tx]))
    )

    // Older history is read on the pruned node
    network.pick = () => network.nodes[0]
    await actions.getOldTransactions(context)
    await actions.getOldTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(30)
    expect(context.state.bottomReached).toBe(true)
    expect(otherNodeSpy).not.toHaveBeenCalled()
  })

  it('latches the bottom when the end of history is reached', async () => {
    const chain = makeChain('tx', 30)
    network.nodes = [nodeOver('https://node-a.example.com', chain)]
    Object.assign(
      context.state.transactions,
      Object.fromEntries(chain.slice(0, TX_CHUNK_SIZE).map((tx) => [tx.hash, tx]))
    )

    await actions.getOldTransactions(context)
    await actions.getOldTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(30)
    expect(context.state.bottomReached).toBe(true)
  })

  it('resets the loading flag when the walk fails', async () => {
    Object.assign(context.state.transactions, { a: makeTx('a', 3) })
    getTransactionsMock.mockRejectedValue(new Error('all indexers offline'))

    await expect(actions.getOldTransactions(context)).rejects.toThrow('all indexers offline')

    expect(context.committed.at(-1)).toEqual(['areOlderLoading', false])
  })

  it('binds cursor to node and restarts without toTx on failover', async () => {
    const chainA = makeChain('nodeA-', 25)
    const chainB = makeChain('nodeB-', 40)
    const nodeAUrl = 'https://node-a.example.com'
    const nodeBUrl = 'https://node-b.example.com'

    // Node B does not know node A's transactions: if queried with node A's cursor, it returns []
    const nodeBQueries = []
    const nodeB = {
      url: nodeBUrl,
      getTransactions: (address, toTx) => {
        nodeBQueries.push(toTx)
        return pagesOver(chainB)(address, toTx)
      }
    }

    let nodeAFailed = false
    const nodeA = {
      url: nodeAUrl,
      getTransactions: (address, toTx) => {
        if (nodeAFailed) {
          return Promise.reject(new Error('connection timeout'))
        }
        return pagesOver(chainA)(address, toTx)
      }
    }

    network.nodes = [nodeA, nodeB]
    network.pick = () => network.nodes[0]
    network.onWalkFail = (_err, failedNode) => {
      expect(failedNode.url).toBe(nodeAUrl)
      network.pick = () => nodeB
    }

    // First page on node A: reads all 25 records and sets oldTxState cursor to nodeA-24
    await actions.getOldTransactions(context)
    expect(Object.keys(context.state.transactions)).toHaveLength(25)
    expect(context.state.oldTxState).toMatchObject({
      node: nodeAUrl,
      cursor: 'nodeA-24'
    })

    // Now node A fails. Failover retries on node B.
    nodeAFailed = true
    await actions.getOldTransactions(context)

    // Node B must have been queried without toTx (undefined) rather than node A's cursor
    expect(nodeBQueries[0]).toBeUndefined()
    expect(context.state.bottomReached).toBe(false)
    expect(context.state.oldTxState).toMatchObject({
      node: nodeBUrl,
      cursor: 'nodeB-24'
    })

    // Finish reading node B
    await actions.getOldTransactions(context)
    expect(nodeBQueries[1]).toBe('nodeB-24')
    expect(context.state.bottomReached).toBe(true)

    // All records of node B are reachable
    for (const tx of chainB) {
      expect(context.state.transactions[tx.hash]).toBeDefined()
    }
  })

  it('clears bottomReached latch when session node fails over', async () => {
    const chainA = makeChain('nodeA-', 20) // < 25 records, latches bottom
    const chainB = makeChain('nodeB-', 40)
    const nodeAUrl = 'https://node-a.example.com'
    const nodeBUrl = 'https://node-b.example.com'

    const nodeA = nodeOver(nodeAUrl, chainA)
    const nodeB = nodeOver(nodeBUrl, chainB)

    network.nodes = [nodeA, nodeB]
    network.pick = () => network.nodes[0]

    // Node A reaches bottom
    await actions.getOldTransactions(context)
    expect(Object.keys(context.state.transactions)).toHaveLength(20)
    expect(context.state.bottomReached).toBe(true)

    // Node A goes offline, failing over to node B
    nodeA.offline = true
    network.generation += 1
    network.pick = () => nodeB

    // Calling getOldTransactions must reset bottomReached and fetch from node B
    await actions.getOldTransactions(context)
    expect(context.state.bottomReached).toBe(false)
    expect(context.state.oldTxState).toMatchObject({
      node: nodeBUrl,
      cursor: 'nodeB-24'
    })

    // Complete node B pagination
    await actions.getOldTransactions(context)
    expect(context.state.bottomReached).toBe(true)
    for (const tx of chainB) {
      expect(context.state.transactions[tx.hash]).toBeDefined()
    }
  })
})
