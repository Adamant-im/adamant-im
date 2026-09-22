import baseActions from '../btc-base/btc-base-actions'
import DogeApi, { CHUNK_SIZE } from '../../../lib/bitcoin/doge-api'
import { dogeIndexer } from '../../../lib/nodes'
import { CryptosInfo } from '@/lib/constants/index.js'

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

/**
 * Fetches recent DOGE transactions.
 *
 * Runs through `dogeIndexer.walkHistory` to ensure node affinity matches the pinned
 * session node used by `getOldTransactions`, avoiding multi-operator fanout and
 * inconsistent node-specific views.
 * Resets `areRecentLoading` in a `finally` block.
 *
 * @param {object} api DOGE API instance
 * @param {object} context Vuex action context
 * @returns {Promise<void>}
 */
const getNewTransactions = async (api, context) => {
  context.commit('areRecentLoading', true)

  try {
    const result = await dogeIndexer.walkHistory((session) => api.getTransactionsVia(session, {}))
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
 * Tracks the raw pagination offset together with the history node/session generation.
 * On a node-generation change, any per-node `bottomReached` latch is cleared, the offset
 * is reset to zero, and pagination restarts from the safe boundary (top of this node's list).
 *
 * @returns `{ end }` — `true` when this node lists nothing beyond the window
 */
const readOlderWindow = async (api, context, session) => {
  const known = context.state.transactions
  const current = context.state.oldTxState
  const isSameNode =
    current && current.node === session.node && current.generation === session.generation

  let offset
  if (isSameNode) {
    offset = current.offset
  } else {
    // Session node changed: clear per-node bottom latch and reset offset to 0
    context.commit('bottom', false)
    // The merged store does not reveal raw positions in this node's list: mapped
    // double-spends and node-specific records make a transaction count unsafe.
    offset = 0
  }

  const from = Math.max(0, offset - (offset > 0 ? OFFSET_OVERLAP : 0))
  const to = offset + CHUNK_SIZE

  const result = await api.getTransactionsVia(session, { from, to })

  if (!result) return { end: false }

  // Positions in the window, as the node lists them. `_mapTransaction` maps a
  // record the indexer flags as a possible double spend to `undefined`: it holds
  // a position in this node's list but never reaches the store
  const window = result.items || []

  if (window.length === 0) {
    // Bind the bottom result to this exact session. Otherwise a replacement node
    // returning an empty list would leave the previous node's state installed and
    // every later scroll would clear the latch and repeat the same empty request.
    context.commit('oldTxState', {
      node: session.node,
      generation: session.generation,
      offset
    })

    return { end: true }
  }

  // The window has to reach back into what is already known on this node. If none of its
  // leading records is, this node's list is shifted against the store by more
  // than the overlap and the window may start past records never read: keeping
  // it would bury that gap under the new offset, so it is dropped
  if (offset > 0 && !window.slice(0, OFFSET_OVERLAP).some((tx) => tx && known[tx.hash])) {
    // The current offset cannot be trusted on this dataset any more. Restarting
    // from its head is safe and establishes a fresh node-local position.
    context.commit('oldTxState', {
      node: session.node,
      generation: session.generation,
      offset: 0
    })

    return { end: false }
  }

  context.commit('transactions', window.filter(Boolean))

  // Advance offset by positions consumed from this node
  context.commit('oldTxState', {
    node: session.node,
    generation: session.generation,
    offset: to
  })

  return { end: !result.hasMore }
}

/**
 * Fetches an older window of DOGE transactions.
 *
 * Reads history windowed by offset on the pinned session node, using an overlap
 * (`OFFSET_OVERLAP`) to prevent skipping transactions if ordering shifts slightly.
 * Latches `bottomReached` when the pinned node has no further records beyond the window.
 * Resets `areOlderLoading` in a `finally` block.
 *
 * @param {object} api DOGE API instance
 * @param {object} context Vuex action context
 * @returns {Promise<void>}
 */
const getOldTransactions = async (api, context) => {
  const currentHistoryNode = dogeIndexer.getHistoryNodeUrl()
  const currentGeneration = dogeIndexer.getHistorySessionGeneration()
  const oldState = context.state.oldTxState
  const isNodeChanged =
    oldState && (oldState.node !== currentHistoryNode || oldState.generation !== currentGeneration)

  if (isNodeChanged) {
    context.commit('bottom', false)
  } else if (context.state.bottomReached) {
    return Promise.resolve()
  }

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
    getNewTransactions,
    resetHistorySession: () => dogeIndexer.resetHistorySession()
  })
}
