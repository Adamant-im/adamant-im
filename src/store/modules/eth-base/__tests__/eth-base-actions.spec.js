import { beforeEach, describe, expect, it, vi } from 'vitest'

const getTransactionsMock = vi.fn()
const getTimestampGroupMock = vi.fn()

vi.mock('@/lib/nodes/eth-indexer', () => {
  const stub = {
    getTransactions: (...args) => getTransactionsMock(...args),
    getTimestampGroup: (...args) => getTimestampGroupMock(...args)
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
    bottomReached: false,
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

/** Wires both indexer methods over one fixed set of transactions */
function serveIndexer(allTransactions) {
  getTransactionsMock.mockImplementation(indexerOver(allTransactions))
  getTimestampGroupMock.mockImplementation(timestampGroupOver(allTransactions))
}

describe('eth-base getNewTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    // first chunk is truncated and the boundary lands exactly on it
    const all = Array.from({ length: 30 }, (_, i) => makeTx(tie, i))
    const context = createContext()

    serveIndexer(all)

    await actions.getNewTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(30)
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
