import { beforeEach, describe, expect, it, vi } from 'vitest'

const getTransactionsMock = vi.fn()

vi.mock('@/lib/nodes/eth-indexer', () => ({
  ethIndexer: { getTransactions: (...args) => getTransactionsMock(...args) },
  default: { getTransactions: (...args) => getTransactionsMock(...args) }
}))

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
const ADDRESS = '0x7e0Bd3F27EC0997A3B17045023097372b4c563B3'

const actions = createActions({
  initTransaction: vi.fn(),
  createSpecificActions: () => ({})
})

/**
 * Runs the real `transactions` mutation so that `maxHeight` advances exactly
 * the way it does in the app: this is the value `getNewTransactions` pages from
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
  return {
    hash: `0x${String(index).padStart(64, '0')}`,
    id: `0x${String(index).padStart(64, '0')}`,
    senderId: ADDRESS,
    recipientId: '0x0000000000000000000000000000000000000000',
    amount: 1,
    fee: 0.001,
    status: 'CONFIRMED',
    time,
    timestamp: time * 1000
  }
}

/** Emulates an indexer honouring `from`, `to`, `limit` and `order` over a fixed set */
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

describe('eth-base getNewTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requests the newest chunk on the very first load', async () => {
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

    getTransactionsMock.mockImplementation(indexerOver(all))

    await actions.getNewTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(30)
    expect(context.state.maxHeight).toBe(newest)
    // First page walks forward from the original boundary, not from the newest result
    expect(getTransactionsMock.mock.calls[0][0]).toMatchObject({
      from: 1_700_000_001,
      order: 'time.asc'
    })
  })

  it('does not skip transactions sharing one block timestamp across a page break', async () => {
    const tie = 1_700_000_100
    // A group of 30 transactions with an identical timestamp straddles the page
    // boundary, followed by a newer one
    const all = [...Array.from({ length: 30 }, (_, i) => makeTx(tie, i)), makeTx(tie + 10, 100)]
    const context = createContext({ maxHeight: 1_700_000_000 })

    getTransactionsMock.mockImplementation(indexerOver(all))

    await actions.getNewTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(31)
  })

  it('keeps the single-timestamp group request bounded', async () => {
    const tie = 1_700_000_100
    const all = Array.from({ length: 30 }, (_, i) => makeTx(tie, i))
    const context = createContext({ maxHeight: 1_700_000_000 })

    getTransactionsMock.mockImplementation(indexerOver(all))

    await actions.getNewTransactions(context)

    const groupCall = getTransactionsMock.mock.calls
      .map(([options]) => options)
      .find((options) => options.to === tie)

    expect(groupCall).toBeDefined()
    expect(groupCall.from).toBe(tie)
    expect(groupCall.limit).toBe(CHUNK_SIZE * 20)
  })

  it('pages ERC-20 history forward the same way', async () => {
    const newest = 1_700_000_030
    const all = Array.from({ length: 30 }, (_, i) => makeTx(newest - i, i))
    const context = createContext({
      maxHeight: 1_700_000_000,
      contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
    })

    getTransactionsMock.mockImplementation(indexerOver(all))

    await actions.getNewTransactions(context)

    expect(Object.keys(context.state.transactions)).toHaveLength(30)
    expect(getTransactionsMock.mock.calls[0][0]).toMatchObject({
      contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      order: 'time.asc',
      limit: CHUNK_SIZE
    })
  })

  it('stops when the indexer keeps returning the same page', async () => {
    const stuck = Array.from({ length: CHUNK_SIZE }, (_, i) => makeTx(1_700_000_050, i))
    const context = createContext({ maxHeight: 1_700_000_000 })

    // A stale or misbehaving node ignores the boundary and replies with the
    // same full chunk every time
    getTransactionsMock.mockResolvedValue(stuck)

    await actions.getNewTransactions(context)

    // One page, one single-timestamp group request, then the cursor moves past
    // that timestamp and the next identical answer is rejected as out of range
    expect(getTransactionsMock.mock.calls.length).toBeLessThanOrEqual(3)
    expect(context.commit).toHaveBeenCalledWith('areRecentLoading', false)
  })

  it('stops when the indexer ignores the requested boundary', async () => {
    const belowBoundary = Array.from({ length: CHUNK_SIZE }, (_, i) => makeTx(1_600_000_000 + i, i))
    const context = createContext({ maxHeight: 1_700_000_000 })

    getTransactionsMock.mockResolvedValue(belowBoundary)

    await actions.getNewTransactions(context)

    expect(getTransactionsMock).toHaveBeenCalledTimes(1)
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

    expect(getTransactionsMock.mock.calls.length).toBe(20)
  })

  it('always bounds the request by a limit', async () => {
    const context = createContext({ maxHeight: 1_700_000_000 })
    getTransactionsMock.mockResolvedValue([])

    await actions.getNewTransactions(context)

    for (const [options] of getTransactionsMock.mock.calls) {
      expect(options.limit).toBe(CHUNK_SIZE)
    }
  })
})
