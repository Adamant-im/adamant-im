import { FetchStatus, TransactionStatus } from '@/lib/constants'
import baseActions from '../btc-base/btc-base-actions'
import BtcApi from '../../../lib/bitcoin/bitcoin-api'
import { btcIndexer } from '../../../lib/nodes'
import { logger } from '@/utils/devTools/logger'

const TX_CHUNK_SIZE = 25

/**
 * Hard cap on pages walked back by a single `getNewTransactions` run. Anything
 * left over is continued by the next refresh tick from the stored cursor.
 */
const MAX_NEW_TX_PAGES = 20

/**
 * Statuses the indexer itself reports. `PENDING` (a freshly broadcast transfer)
 * and `REJECTED` (a failed broadcast) exist only locally, same as in DOGE
 */
const INDEXER_STATUSES = [TransactionStatus.REGISTERED, TransactionStatus.CONFIRMED]

const isIndexed = (tx) => INDEXER_STATUSES.includes(tx.status)

/**
 * The newest transaction a catch-up walk can rely on finding again.
 *
 * `sortedTransactions[0]` may be a locally created record the indexer has never
 * seen. A `REGISTERED` one is not safe either: it can still be dropped from the
 * mempool or replaced, and a target that no longer exists can never be found, so
 * only a confirmed transaction proves the new pages join the known history.
 *
 * The identifier is `hash`: that is what `normalizeTransaction` produces, and it
 * is what the indexer paginates by
 */
const latestConfirmedHash = (context) => {
  const latest = context.getters.sortedTransactions.find(
    (tx) => tx.status === TransactionStatus.CONFIRMED
  )

  return latest && latest.hash
}

/** The oldest known transaction, used as the cursor for older history */
const oldestIndexedHash = (context) => {
  const transactions = context.getters.sortedTransactions.filter(isIndexed)
  const oldest = transactions[transactions.length - 1]

  return oldest && oldest.hash
}

const customActions = (getApi) => ({
  updateStatus(context) {
    const api = getApi()

    if (!api) return
    btcIndexer
      .getBalance(context.state.address)
      .then((balance) => {
        context.commit('status', { balance })
        context.commit('setBalanceStatus', FetchStatus.Success)
      })
      .catch((err) => {
        context.commit('setBalanceStatus', FetchStatus.Error)
        logger.log('btc-actions', 'warn', err)
      })

    // The unspent transactions are needed to estimate the fee
    btcIndexer
      .getUnspents(context.state.address)
      .then((utxo) => context.commit('utxo', utxo))
      .catch((err) => logger.log('btc-actions', 'warn', err))

    // The estimated fee rate is also needed
    btcIndexer
      .getFeeRate()
      .then((rate) => context.commit('feeRate', rate['2']))
      .catch((err) => logger.log('btc-actions', 'warn', err))

    // Last block height
    context.dispatch('updateHeight')
  },

  updateHeight({ commit }) {
    const api = getApi()
    if (!api) return

    btcIndexer
      .getHeight()
      .then((height) => commit('height', height))
      .catch((err) => logger.log('btc-actions', 'warn', err))
  }
})

/**
 * Walks history back until `latestHash` shows up again, which is what proves the
 * newly fetched records join the history already in the store.
 *
 * The indexer is paged by "everything older than this txid", which is not a
 * monotonic cursor: a stale or misbehaving node can cycle pages (`A -> B -> A`)
 * without ever repeating the immediately preceding cursor. Every visited cursor
 * is therefore remembered, and the walk is bounded by a page cap on top of that.
 *
 * @returns how the walk ended:
 *   - `reached` — continuity is proven (or there was nothing to prove);
 *   - `budget` — out of pages, `cursor` is where this node continues;
 *   - `exhausted` — this node's history ended without the target;
 *   - `cycled` — this node repeated a cursor.
 *   Only `reached` proves continuity: the last two are facts about one node
 */
const retrieveNewTransactions = async (context, session, latestHash, startCursor) => {
  const visitedCursors = new Set()
  let toTx = startCursor

  for (let page = 0; page < MAX_NEW_TX_PAGES; page++) {
    const transactions = await session.getTransactions(context.state.address, toTx)

    if (transactions.length === 0) {
      // Nothing to prove on the very first page of an empty history
      if (!latestHash && !toTx) return { outcome: 'reached' }

      // This node ran out: it may keep a shorter history, or the target is gone
      return { outcome: 'exhausted' }
    }

    context.commit('transactions', transactions)

    // History is continuous again: the known transaction is in the page
    if (!latestHash || transactions.some((x) => x.hash === latestHash)) {
      return { outcome: 'reached' }
    }

    const oldest = transactions[transactions.length - 1]
    if (!oldest || !oldest.hash) return { outcome: 'exhausted' }

    // A cursor seen before means the node is cycling pages instead of paging back
    if (visitedCursors.has(oldest.hash)) return { outcome: 'cycled' }

    visitedCursors.add(oldest.hash)
    toTx = oldest.hash
  }

  // Out of page budget with the gap still open
  return { outcome: 'budget', cursor: toTx }
}

/**
 * Fetches new BTC transactions to catch up the store with the latest block tip.
 *
 * Implements a bounded catch-up walk with continuity guarantees:
 * - Continuity target (`gapTarget`) is captured *before* entering `walkHistory`.
 *   If node A commits partial pages and fails, retries inside `requestHistoryWithRetry`
 *   receive the original target rather than `latestConfirmedHash` from newly committed pages,
 *   preventing historical gaps from being skipped.
 * - In exhausted mode (node ran out of history without reaching `gapTarget`), subsequent
 *   refreshes on the same node check only the head (`headTarget`), while preserving `gapTarget`
 *   in state so a failover to a different node can attempt full catch-up.
 * - If head catch-up hits its budget limit, `exhausted: true` is preserved alongside `headTarget`
 *   and `cursor`, ensuring multi-tick head catch-up continues smoothly.
 * - Resets `areRecentLoading` in a `finally` block to ensure UI loaders never hang.
 *
 * @param {object} api BTC API instance
 * @param {object} context Vuex action context
 * @returns {Promise<void>}
 */
const getNewTransactions = async (api, context) => {
  context.commit('areRecentLoading', true)

  try {
    // The continuity target is captured BEFORE entering walkHistory. If the first node
    // commits partial pages and fails, retries inside requestHistoryWithRetry run
    // against this pre-walk target rather than latestConfirmedHash from the just-committed
    // records, which would silently leave the original historical gap open.
    const pending = context.state.newTxCatchUp
    const isExhaustedMode = Boolean(pending && pending.exhausted)
    const gapTarget = pending ? pending.target : latestConfirmedHash(context)
    const headTarget = isExhaustedMode
      ? pending.headTarget || latestConfirmedHash(context)
      : undefined
    const pendingNode = pending ? pending.node : undefined
    const pendingCursor = pending ? pending.cursor : undefined

    // Every page of one walk is served by the same indexer without cross-node fanout:
    // a cursor only means something within the dataset it came from
    const { outcome, cursor, node, walkTarget, isNodeExhaustedOnSession } =
      await btcIndexer.walkHistory(async (session) => {
        // If this node already exhausted its history without reaching gapTarget on a previous pass,
        // do not repeat the full walk down to the missing target on consecutive refreshes on this node;
        // only check for new transactions above headTarget, while preserving gapTarget.
        // If session.node switched to another node on failover, it restarts from the top towards gapTarget.
        const isNodeExhaustedOnSession = Boolean(isExhaustedMode && pendingNode === session.node)
        const walkTarget = isNodeExhaustedOnSession ? headTarget : gapTarget
        const startCursor = session.node === pendingNode ? pendingCursor : undefined

        const result = await retrieveNewTransactions(context, session, walkTarget, startCursor)

        return {
          ...result,
          node: session.node,
          walkTarget,
          isNodeExhaustedOnSession
        }
      })

    if (outcome === 'reached') {
      // If this session was in exhausted mode, reaching the head target only proves
      // that head is up to date — the historical gap down to gapTarget is still pending.
      if (isNodeExhaustedOnSession) {
        context.commit('newTxCatchUp', {
          target: gapTarget,
          cursor: undefined,
          node,
          exhausted: true
        })
      } else {
        context.commit('newTxCatchUp', null)
      }
    } else if (outcome === 'budget') {
      if (isNodeExhaustedOnSession) {
        // Preserve exhausted state while a multi-tick head catch-up is in progress
        context.commit('newTxCatchUp', {
          target: gapTarget,
          headTarget: walkTarget,
          cursor,
          node,
          exhausted: true
        })
      } else {
        context.commit('newTxCatchUp', { target: gapTarget, cursor, node })
      }
    } else {
      // outcome is 'exhausted' or 'cycled':
      // This node cannot prove continuity towards target (either pruned or reorged).
      // Mark as exhausted on this node so subsequent refreshes on the same node do not
      // repeat the walk, while keeping target so a different node can attempt catch-up on failover.
      context.commit('newTxCatchUp', {
        target: gapTarget,
        cursor: undefined,
        node,
        exhausted: true
      })
    }
  } finally {
    context.commit('areRecentLoading', false)
  }
}

/**
 * Reads one page of history older than the oldest known transaction on the node
 * `session` is pinned to, and keeps it.
 *
 * @returns `{ end }` — `true` when this node has nothing older than that page
 */
const readOlderPage = async (context, session) => {
  const chunk = await session.getTransactions(context.state.address, oldestIndexedHash(context))

  context.commit('transactions', chunk)

  return { end: chunk.length < TX_CHUNK_SIZE }
}

/**
 * Fetches a page of transactions older than the oldest indexed transaction in the store.
 *
 * Walks history using the pinned session node to prevent cross-node cursor contamination.
 * When the serving node returns fewer than `TX_CHUNK_SIZE` transactions, it indicates
 * the end of history on this node and latches `bottomReached`.
 * Resets `areOlderLoading` in a `finally` block.
 *
 * @param {object} api BTC API instance
 * @param {object} context Vuex action context
 * @returns {Promise<void>}
 */
const getOldTransactions = async (api, context) => {
  // If we already have the most old transaction for this address, no need to request anything
  if (context.state.bottomReached) return Promise.resolve()

  context.commit('areOlderLoading', true)

  try {
    // An offset/cursor is a position in one node's list, so history is read on one node
    // without fanning out address queries across other indexers
    const { end } = await btcIndexer.walkHistory(async (session) => ({
      ...(await readOlderPage(context, session)),
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
    apiCtor: BtcApi,
    getOldTransactions,
    getNewTransactions,
    resetHistorySession: () => btcIndexer.resetHistorySession(),
    customActions
  })
}
