import { beforeEach, describe, expect, it, vi } from 'vitest'

const getTransactionsMock = vi.fn()

vi.mock('@/lib/nodes', () => ({
  btcIndexer: {
    getTransactions: (...args) => getTransactionsMock(...args)
  }
}))

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

/**
 * Builds a Vuex-like context stub
 */
function createContext(transactions = {}) {
  const committed = []
  return {
    state: {
      address: 'btc-address',
      transactions,
      bottomReached: false
    },
    getters: {
      get sortedTransactions() {
        return Object.values(transactions).sort((a, b) => b.timestamp - a.timestamp)
      }
    },
    commit(type, payload) {
      committed.push([type, payload])
      if (type === 'transactions') {
        for (const tx of payload) {
          transactions[tx.txid || tx.hash] = tx
        }
      }
    },
    dispatch: vi.fn(() => Promise.resolve())
  }
}

function makeTx(txid, timestamp) {
  return { txid, hash: txid, timestamp }
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
})
