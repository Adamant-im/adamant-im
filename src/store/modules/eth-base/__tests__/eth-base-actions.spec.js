import { beforeEach, describe, expect, it, vi } from 'vitest'

const getTransactionsMock = vi.fn()
const getTimestampGroupMock = vi.fn()

/**
 * A fake network of indexers. By default it is a single node served by the two
 * mocks above; tests that need several nodes with different datasets replace
 * `network.nodes` and choose which one serves a walk through `network.pick`.
 */
const network = {
  nodes: [],
  pick: () => network.nodes[0],
  pinnedUrl: null,
  generation: 0
}

function resetNetwork() {
  network.nodes = [{ url: 'https://indexer.example.com' }]
  network.pick = () => network.nodes[0]
  network.pinnedUrl = network.nodes[0].url
  network.generation = 0
}

vi.mock('@/lib/nodes/eth-indexer', () => {
  const sessionFor = (node) => ({
    node: node.url,
    generation: network.generation,
    getTransactions: (params) =>
      node.getTransactions ? node.getTransactions(params) : getTransactionsMock(params),
    getTimestampGroup: (params) =>
      node.getTimestampGroup ? node.getTimestampGroup(params) : getTimestampGroupMock(params)
  })

  const stub = {
    // Mirrors the real client: every request of one walk gets the same node
    walkHistory: (walk) => {
      const node = network.pick()
      network.pinnedUrl = node.url

      return walk(sessionFor(node))
    },
    getHistoryNodeUrl: () => {
      const pinned = network.nodes.find((node) => node.url === network.pinnedUrl)

      return pinned?.offline ? undefined : pinned?.url
    },
    getHistorySessionGeneration: () => network.generation,
    resetHistorySession: () => {
      network.pinnedUrl = null
      network.generation += 1
    }
  }

  return { ethIndexer: stub, default: stub }
})

vi.mock('@/lib/nodes/eth', () => ({
  eth: { useClient: vi.fn() },
  default: { useClient: vi.fn() }
}))

vi.mock('@/lib/nodes/adm', () => ({
  adm: {},
  default: {}
}))

vi.mock('web3-eth-accounts', () => ({
  signTransaction: vi.fn(),
  TransactionFactory: { fromTxData: vi.fn() }
}))

vi.mock('web3-eth-contract', () => ({
  default: class EthContractStub {}
}))

// Breaks the transitive import cycle: this module imports `@/store`
vi.mock('@/lib/store-crypto-address', () => ({
  storeCryptoAddress: vi.fn(),
  validateStoredCryptoAddresses: vi.fn(),
  flushCryptoAddresses: vi.fn()
}))

import createActions from '../eth-base-actions'
import mutations from '../eth-base-mutations'

const CHUNK_SIZE = 25
const MAX_NEW_TX_PAGES = 20
const MAX_TIMESTAMP_GROUP_PAGES = 40
const INDEXER_NODE = 'https://indexer.example.com'
const ADDRESS = '0x7e0Bd3F27EC0997A3B17045023097372b4c563B3'

const actions = createActions({
  initTransaction: vi.fn(),
  createSpecificActions: () => ({})
})

/**
 * Runs the real mutations so that `maxHeight` advances exactly the way it does
 * in the app: that value is the boundary the next update pages from
 */
function createContext(overrides = {}) {
  const state = {
    crypto: 'ETH',
    address: ADDRESS,
    decimals: 18,
    contractAddress: undefined,
    transactions: {},
    transactionsCount: 0,
    maxHeight: -1,
    minHeight: Infinity,
    timestampGroupCursor: null,
    bottomReached: false,
    historySession: { node: INDEXER_NODE, generation: 0 },
    ...overrides
  }

  const context = {
    state,
    getters: {},
    commit: vi.fn((name, payload) => {
      if (mutations[name]) mutations[name](state, payload)
    }),
    dispatch: vi.fn(() => Promise.resolve())
  }

  return context
}

function makeTx(time, index) {
  const hash = `0x${String(index).padStart(64, '0')}`

  return {
    hash,
    id: hash,
    senderId: ADDRESS,
    recipientId: '0x0000000000000000000000000000000000000000',
    amount: 1,
    fee: 0.001,
    status: 'CONFIRMED',
    time,
    timestamp: time * 1000
  }
}

/** Emulates an indexer honouring `from`, `limit` and `order` over a fixed set */
function indexerOver(allTransactions) {
  return ({ from, to, limit, order }) => {
    const filtered = allTransactions.filter(
      (tx) => (!from || tx.time >= from) && (!to || tx.time <= to)
    )
    const sorted = [...filtered].sort((a, b) =>
      order === 'time.asc' ? a.time - b.time : b.time - a.time
    )

    return Promise.resolve(sorted.slice(0, limit))
  }
}

/** Emulates the deterministic `(time, txhash)` paging of a timestamp group */
function timestampGroupOver(allTransactions) {
  return ({ time, limit, offset = 0 }) => {
    const group = allTransactions
      .filter((tx) => tx.time === time)
      .sort((a, b) => (a.hash < b.hash ? -1 : 1))

    return Promise.resolve(group.slice(offset, offset + limit))
  }
}

/** An indexer node holding its own dataset */
function nodeOver(url, allTransactions) {
  return {
    url,
    getTransactions: indexerOver(allTransactions),
    getTimestampGroup: timestampGroupOver(allTransactions)
  }
}

/** Wires both indexer methods over one fixed set of transactions */
function serveIndexer(allTransactions) {
  getTransactionsMock.mockImplementation(indexerOver(allTransactions))
  getTimestampGroupMock.mockImplementation(timestampGroupOver(allTransactions))
}

describe('eth-base getNewTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetNetwork()
  })

  it('requests the newest chunk on the very first update', async () => {
    const context = createContext()
    getTransactionsMock.mockResolvedValue([])

    await actions.getNewTransactions(context)

    expect(getTransactionsMock).toHaveBeenCalledTimes(1)
    expect(getTransactionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: 0, limit: CHUNK_SIZE, order: 'time.desc' })
    )
  })

  it('loads every transaction when more than a chunk appeared since the last update', async () => {
    const newest = 1_700_000_030
    // 30 new transactions above the known boundary
    const all = Array.from({ length: 30 }, (_, i) => makeTx(newest - i, i))
    const context = createContext({ maxHeight: 1_700_000_000 })

    serveIndexer(all)

    await actions.getNewTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(30)
    expect(context.state.maxHeight).toBe(newest)
    // The first page walks forward from the original boundary, not from the newest result
    expect(getTransactionsMock.mock.calls[0][0]).toMatchObject({
      from: 1_700_000_001,
      order: 'time.asc'
    })
  })

  it('does not skip transactions sharing one block timestamp across a page break', async () => {
    const tie = 1_700_000_100
    // 30 transactions with an identical timestamp straddle the page boundary
    const all = [...Array.from({ length: 30 }, (_, i) => makeTx(tie, i)), makeTx(tie + 10, 100)]
    const context = createContext({ maxHeight: 1_700_000_000 })

    serveIndexer(all)

    await actions.getNewTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(31)
    expect(context.state.maxHeight).toBe(tie + 10)
  })

  it('pages a timestamp group by offset over a deterministic order', async () => {
    const tie = 1_700_000_100
    const all = Array.from({ length: 60 }, (_, i) => makeTx(tie, i))
    const context = createContext({ maxHeight: 1_700_000_000 })

    serveIndexer(all)

    await actions.getNewTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(60)
    // 0, 25, 50 — the last page is short and ends the group
    expect(getTimestampGroupMock.mock.calls.map(([options]) => options.offset)).toEqual([0, 25, 50])
    for (const [options] of getTimestampGroupMock.mock.calls) {
      expect(options).toMatchObject({ time: tie, limit: CHUNK_SIZE })
    }
  })

  it('keeps the boundary below a timestamp group that could not be proven complete', async () => {
    const tie = 1_700_000_100
    const context = createContext({ maxHeight: 1_700_000_000 })

    getTransactionsMock.mockImplementation(
      indexerOver(Array.from({ length: CHUNK_SIZE }, (_, i) => makeTx(tie, i)))
    )
    // Every group page stays full: the group never ends
    getTimestampGroupMock.mockImplementation(({ limit, offset = 0 }) =>
      Promise.resolve(Array.from({ length: limit }, (_, i) => makeTx(tie, offset + i)))
    )

    await actions.getNewTransactions(context)

    // Stepping over `tie` would lose its unread part, so the boundary stays below
    expect(context.state.maxHeight).toBe(1_700_000_000)
  })

  it('resumes from the unfinished timestamp when the page cap interrupts the catch-up', async () => {
    // Two transactions per block timestamp, so every chunk boundary falls inside
    // a group and the page cap is guaranteed to interrupt one of them
    const base = 1_700_000_000
    const all = []
    let index = 0
    for (let i = 1; i <= 300; i++) {
      all.push(makeTx(base + i, index++))
      all.push(makeTx(base + i, index++))
    }

    const context = createContext({ maxHeight: base })
    serveIndexer(all)

    await actions.getNewTransactions(context)

    // The run is cut short by the cap, not by reaching the newest transaction
    expect(getTransactionsMock.mock.calls.length).toBe(MAX_NEW_TX_PAGES)
    expect(Object.keys(context.state.transactions).length).toBeLessThan(all.length)

    // The boundary must never sit inside a group that the limit cut in half
    const boundary = context.state.maxHeight
    const loadedAtBoundary = Object.values(context.state.transactions).filter(
      (tx) => tx.time === boundary
    ).length
    expect(loadedAtBoundary).toBe(all.filter((tx) => tx.time === boundary).length)

    // Further updates pick the rest up without losing anything
    for (let run = 0; run < 40; run++) {
      await actions.getNewTransactions(context)
    }

    expect(Object.keys(context.state.transactions)).toHaveLength(all.length)
  })

  it('completes a truncated single-timestamp first chunk', async () => {
    const tie = 1_700_000_100
    // The newest 30 transactions all share one timestamp, so the descending
    // first chunk is truncated and neither boundary can be placed until the
    // group is complete
    const all = Array.from({ length: 30 }, (_, i) => makeTx(tie, i))
    const context = createContext()

    serveIndexer(all)

    await actions.getNewTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(30)
    expect(context.state.maxHeight).toBe(tie)
    expect(context.state.minHeight).toBe(tie)
  })

  it('leaves both boundaries unset while the first timestamp group is unfinished', async () => {
    const tie = 1_700_000_100
    const context = createContext()

    getTransactionsMock.mockImplementation(
      indexerOver(Array.from({ length: CHUNK_SIZE }, (_, i) => makeTx(tie, i)))
    )
    // Every group page stays full: the group never ends
    getTimestampGroupMock.mockImplementation(({ limit, offset = 0 }) =>
      Promise.resolve(Array.from({ length: limit }, (_, i) => makeTx(tie, offset + i)))
    )

    await actions.getNewTransactions(context)

    // Advancing either boundary would make the unread part of the group
    // unreachable from both directions
    expect(context.state.maxHeight).toBe(-1)
    expect(context.state.minHeight).toBe(Infinity)
    expect(context.state.timestampGroupCursor).toMatchObject({ time: tie })
  })

  it('resumes a timestamp group larger than the page budget on the next update', async () => {
    const tie = 1_700_000_100
    // One record more than a single update can read
    const groupSize = MAX_TIMESTAMP_GROUP_PAGES * CHUNK_SIZE + 1
    const all = Array.from({ length: groupSize }, (_, i) => makeTx(tie, i))
    const context = createContext({ maxHeight: 1_700_000_000 })

    serveIndexer(all)

    await actions.getNewTransactions(context)

    // Out of budget: the progress is recorded and the boundary stays below the group
    expect(context.state.timestampGroupCursor).toEqual({
      time: tie,
      offset: MAX_TIMESTAMP_GROUP_PAGES * CHUNK_SIZE,
      node: INDEXER_NODE
    })
    expect(context.state.maxHeight).toBe(1_700_000_000)

    await actions.getNewTransactions(context)

    // The second update continues from the stored offset instead of rereading
    expect(Object.keys(context.state.transactions)).toHaveLength(groupSize)
    expect(context.state.timestampGroupCursor).toBe(null)
    expect(context.state.maxHeight).toBe(tie)
  })

  it('drops the group cursor when the store has been wiped', async () => {
    const tie = 1_700_000_100
    // 60 records sharing one timestamp. The plain `time` order the first chunk uses
    // lists them opposite to the `(time, txhash)` order the group is paged by, so
    // the first chunk does not happen to cover the group's own prefix
    const all = Array.from({ length: 60 }, (_, i) => makeTx(tie, 59 - i))
    // The browser dropped the records but kept the counters and the cursor
    const context = createContext({
      transactionsCount: 60,
      maxHeight: tie,
      timestampGroupCursor: { time: tie, offset: 25, node: INDEXER_NODE }
    })

    serveIndexer(all)

    await actions.getNewTransactions(context)

    // The prefix before offset 25 is gone from the store, so it is read again
    expect(Object.keys(context.state.transactions)).toHaveLength(60)
  })

  it('resets the loading flag when the walk fails', async () => {
    const context = createContext({ maxHeight: 1_700_000_000 })
    getTransactionsMock.mockRejectedValue(new Error('all indexers offline'))

    await expect(actions.getNewTransactions(context)).rejects.toThrow('all indexers offline')

    expect(context.commit).toHaveBeenLastCalledWith('areRecentLoading', false)
  })

  it('ignores a group cursor left by a different indexer', async () => {
    const tie = 1_700_000_100
    const all = Array.from({ length: 30 }, (_, i) => makeTx(tie, i))
    const context = createContext({
      maxHeight: 1_700_000_000,
      // Recorded against a node that may hold a different set of records
      timestampGroupCursor: { time: tie, offset: 25, node: 'https://other.example.com' }
    })

    serveIndexer(all)

    await actions.getNewTransactions(context)

    // Restarted from the beginning of the group instead of trusting the offset
    expect(getTimestampGroupMock.mock.calls[0][0].offset).toBe(0)
    expect(Object.keys(context.state.transactions)).toHaveLength(30)
  })
})

describe('eth-base getOldTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetNetwork()
  })

  it('does not step below a timestamp group cut by the page limit', async () => {
    // 24 newer records plus a group of 30 sharing one timestamp: the descending
    // page ends inside that group
    const tie = 1_700_000_100
    const all = [
      ...Array.from({ length: 24 }, (_, i) => makeTx(tie + 10 + i, i)),
      ...Array.from({ length: 30 }, (_, i) => makeTx(tie, 100 + i))
    ]
    const context = createContext()

    serveIndexer(all)

    await actions.getNewTransactions(context)
    // Walk to the bottom
    for (let page = 0; page < 5; page++) {
      await actions.getOldTransactions(context)
    }

    expect(Object.keys(context.state.transactions)).toHaveLength(all.length)
    expect(context.state.bottomReached).toBe(true)
  })

  it('keeps the bottom boundary above an unresolved timestamp group', async () => {
    const tie = 1_700_000_100
    const context = createContext({ minHeight: tie + 1, maxHeight: tie + 1 })

    getTransactionsMock.mockImplementation(
      indexerOver(Array.from({ length: CHUNK_SIZE }, (_, i) => makeTx(tie, i)))
    )
    getTimestampGroupMock.mockImplementation(({ limit, offset = 0 }) =>
      Promise.resolve(Array.from({ length: limit }, (_, i) => makeTx(tie, offset + i)))
    )

    await actions.getOldTransactions(context)

    expect(context.state.minHeight).toBe(tie + 1)
    expect(context.state.bottomReached).toBe(false)
  })

  it('latches the bottom when the serving indexer runs out without querying other nodes', async () => {
    // Production shape: two full indexers with 53 records and a pruned one with 11
    const all = Array.from({ length: 53 }, (_, i) => makeTx(1_750_000_000 + i * 1000, i))
    const pruned = all.slice(-11)
    const otherNodeSpy = vi.fn()
    network.nodes = [
      nodeOver('https://full-1.example.com', all),
      nodeOver('https://pruned.example.com', pruned),
      {
        url: 'https://full-2.example.com',
        getTransactions: (...args) => {
          otherNodeSpy(...args)
          return nodeOver('https://full-2.example.com', all).getTransactions(...args)
        }
      }
    ]

    const context = createContext()

    // The walk is pinned to the pruned node
    network.pick = () => network.nodes[1]
    await actions.getNewTransactions(context)
    expect(Object.keys(context.state.transactions)).toHaveLength(11)

    // Older history runs out on the pruned node and latches bottom without fanning out
    await actions.getOldTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(11)
    expect(context.state.bottomReached).toBe(true)
    expect(otherNodeSpy).not.toHaveBeenCalled()
  })

  it('discards timestamp boundaries and restarts from the replacement node after failover', async () => {
    const shallow = Array.from({ length: 11 }, (_, i) => makeTx(1_750_000_000 + i, i))
    const replacement = Array.from({ length: 53 }, (_, i) => makeTx(1_850_000_000 + i, 100 + i))
    network.nodes = [
      nodeOver('https://shallow.example.com', shallow),
      nodeOver('https://replacement.example.com', replacement)
    ]
    network.pick = () => network.nodes[0]
    network.pinnedUrl = network.nodes[0].url

    const context = createContext({
      historySession: { node: network.nodes[0].url, generation: network.generation }
    })

    await actions.getNewTransactions(context)
    await actions.getOldTransactions(context)

    expect(context.state.bottomReached).toBe(true)
    expect(Object.keys(context.state.transactions)).toHaveLength(shallow.length)

    network.nodes[0].offline = true
    network.generation += 1
    network.pick = () => network.nodes[1]

    // The old bottom latch must not suppress the first request to the replacement.
    await actions.getOldTransactions(context)
    for (let page = 0; page < 5 && !context.state.bottomReached; page++) {
      await actions.getOldTransactions(context)
    }

    expect(context.state.historySession).toEqual({
      node: network.nodes[1].url,
      generation: network.generation
    })
    expect(context.state.bottomReached).toBe(true)
    for (const tx of replacement) {
      expect(context.state.transactions[tx.hash]).toBeDefined()
    }
  })

  it('latches the bottom on a confirmed short page without an extra round trip', async () => {
    // 30 records: the first chunk takes 25, the next page is short
    const all = Array.from({ length: 30 }, (_, i) => makeTx(1_750_000_000 + i * 10, i))
    const context = createContext()

    serveIndexer(all)

    await actions.getNewTransactions(context)
    getTransactionsMock.mockClear()

    await actions.getOldTransactions(context)

    // One request: the short page itself proves the end, no empty page needed
    expect(getTransactionsMock).toHaveBeenCalledTimes(1)
    expect(context.state.bottomReached).toBe(true)
    expect(Object.keys(context.state.transactions)).toHaveLength(30)
  })

  it('resets the loading flag when the walk fails', async () => {
    const context = createContext({ minHeight: 1_700_000_000 })
    getTransactionsMock.mockRejectedValue(new Error('all indexers offline'))

    await expect(actions.getOldTransactions(context)).rejects.toThrow('all indexers offline')

    expect(context.commit).toHaveBeenLastCalledWith('areOlderLoading', false)
  })

  it('reports the bottom on an empty page', async () => {
    const context = createContext({ minHeight: 1_700_000_000 })
    getTransactionsMock.mockResolvedValue([])

    await actions.getOldTransactions(context)

    expect(context.commit).toHaveBeenCalledWith('bottom', true)
  })

  it('does not request anything once the bottom is reached', async () => {
    const context = createContext({ bottomReached: true })

    await actions.getOldTransactions(context)

    expect(getTransactionsMock).not.toHaveBeenCalled()
  })

  it('stops when the indexer ignores the requested boundary', async () => {
    const belowBoundary = Array.from({ length: CHUNK_SIZE }, (_, i) => makeTx(1_600_000_000 + i, i))
    const context = createContext({ maxHeight: 1_700_000_000 })

    getTransactionsMock.mockResolvedValue(belowBoundary)

    await actions.getNewTransactions(context)

    expect(getTransactionsMock).toHaveBeenCalledTimes(1)
    expect(context.state.maxHeight).toBe(1_700_000_000)
  })

  it('bounds the number of pages for an endless stream of new transactions', async () => {
    let counter = 0
    const context = createContext({ maxHeight: 1_700_000_000 })

    // Every page is full and strictly newer than the previous one: only the
    // page cap stops this
    getTransactionsMock.mockImplementation(({ from }) =>
      Promise.resolve(
        Array.from({ length: CHUNK_SIZE }, () => {
          counter += 1
          return makeTx(from + counter, counter)
        })
      )
    )

    await actions.getNewTransactions(context)

    expect(getTransactionsMock.mock.calls.length).toBe(MAX_NEW_TX_PAGES)
  })

  it('pages ERC-20 history forward the same way', async () => {
    const newest = 1_700_000_030
    const all = Array.from({ length: 30 }, (_, i) => makeTx(newest - i, i))
    const contractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
    const context = createContext({ maxHeight: 1_700_000_000, contractAddress })

    serveIndexer(all)

    await actions.getNewTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(30)
    expect(getTransactionsMock.mock.calls[0][0]).toMatchObject({
      contract: contractAddress,
      order: 'time.asc',
      limit: CHUNK_SIZE
    })
  })

  it('always bounds every request by a limit', async () => {
    const context = createContext({ maxHeight: 1_700_000_000 })
    getTransactionsMock.mockResolvedValue([])

    await actions.getNewTransactions(context)

    for (const [options] of getTransactionsMock.mock.calls) {
      expect(options.limit).toBe(CHUNK_SIZE)
    }
  })
})
