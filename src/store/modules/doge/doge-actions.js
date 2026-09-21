import baseActions from '../btc-base/btc-base-actions'
import DogeApi, { CHUNK_SIZE } from '../../../lib/bitcoin/doge-api'
import { dogeIndexer } from '../../../lib/nodes'
import { CryptosInfo, TransactionStatus } from '@/lib/constants/index.js'

/**
 * Records re-requested in front of every older-history window.
 *
 * History is paged by an offset into the responding node's own list, and the
 * indexers do not agree on that list: transactions sharing a timestamp come back
 * in a different order, and one node may list a record the others do not. On the
 * production indexers a transaction sits at most 2 positions away from where
 * another node puts it, so re-reading a few records before the offset keeps a
 * window boundary from stepping over one. Re-read records are merged by hash.
 */
const OFFSET_OVERLAP = 5

const getNewTransactions = async (api, context) => {
  context.commit('areRecentLoading', true)

  try {
    const result = await api.getTransactions({})
    if (result) {
      context.commit('transactions', result.items)
    }
  } finally {
    context.commit('areRecentLoading', false)
  }
}

/**
 * Reads the next window of older history on the node `session` is pinned to.
 *
 * @returns `{ end }` — `true` when this node lists nothing beyond the window,
 *   which only speaks for this node's list: the caller confirms it elsewhere
 */
const readOlderWindow = async (api, context, session) => {
  const known = context.state.transactions

  // Only confirmed transactions define the offset. Locally created ones never reach
  // the indexer at all, and a mempool one is listed by some nodes and not others,
  // or dropped altogether: counting either overshoots the offset and skips real
  // history, while leaving one out merely re-reads a record already in the store
  const offset = Object.values(known).filter(
    (tx) => tx.status === TransactionStatus.CONFIRMED
  ).length

  const result = await api.getTransactionsVia(session, {
    from: Math.max(0, offset - OFFSET_OVERLAP),
    to: offset + CHUNK_SIZE
  })

  if (!result) return { end: false }

  // Positions in the window, as the node lists them. `_mapTransaction` maps a
  // record the indexer flags as a possible double spend to `undefined`: it holds
  // a position in this node's list but never reaches the store
  const window = result.items || []

  if (window.length === 0) return { end: true }

  // The window has to reach back into what is already known. If none of its
  // leading records is, this node's list is shifted against the store by more
  // than the overlap and the window may start past records never read: keeping
  // it would bury that gap under the new offset, so it is dropped
  if (offset > 0 && !window.slice(0, OFFSET_OVERLAP).some((tx) => tx && known[tx.hash])) {
    return { end: false }
  }

  context.commit('transactions', window.filter(Boolean))

  return { end: !result.hasMore }
}

const getOldTransactions = async (api, context) => {
  // If we already have the most old transaction for this address, no need to request anything
  if (context.state.bottomReached) return Promise.resolve()

  context.commit('areOlderLoading', true)

  try {
    // An offset is a position in one node's list, so a window is read on one node
    // without fanning out address queries across other indexers
    const { end } = await dogeIndexer.walkHistory(async (session) => ({
      ...(await readOlderWindow(api, context, session)),
      node: session.node
    }))

    if (end) {
      context.commit('bottom', true)
    }
  } finally {
    context.commit('areOlderLoading', false)
  }
}

export default {
  ...baseActions({
    apiCtor: DogeApi,
    balanceCheckInterval: CryptosInfo.DOGE.balanceCheckInterval,
    balanceValidInterval: CryptosInfo.DOGE.balanceValidInterval,
    getOldTransactions,
    getNewTransactions
  })
}
