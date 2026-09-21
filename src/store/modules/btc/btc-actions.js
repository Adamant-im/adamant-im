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

const getNewTransactions = async (api, context) => {
  context.commit('areRecentLoading', true)

  try {
    // Every page of one walk is served by the same indexer without cross-node fanout:
    // a cursor only means something within the dataset it came from
    const { outcome, cursor, node, target } = await btcIndexer.walkHistory(async (session) => {
      // A walk stopped by the page cap keeps its own target: it cannot be recomputed
      // once its own pages are in the store, because the newest record would then be
      // one of them and the very first page would end the walk, leaving the gap down
      // to the previously known history unloaded forever. The target is a fact about
      // the chain and survives a change of indexer; the cursor is a position in one
      // node's list and does not, so on another node the walk restarts from the top
      const pending = context.state.newTxCatchUp
      const isNodeExhausted = Boolean(pending && pending.node === session.node && pending.exhausted)
      // If this node already exhausted its history without reaching target on a previous pass,
      // do not repeat the full walk down to the missing target on consecutive refreshes;
      // only check for new transactions above the newest known hash, while preserving the gap target.
      const target = isNodeExhausted
        ? latestConfirmedHash(context)
        : pending
          ? pending.target
          : latestConfirmedHash(context)
      const startCursor =
        pending && pending.node === session.node && !pending.exhausted ? pending.cursor : undefined

      const result = await retrieveNewTransactions(context, session, target, startCursor)

      return {
        ...result,
        node: session.node,
        target: pending ? pending.target : target,
        isNodeExhausted
      }
    })

    if (outcome === 'reached') {
      // If this node was previously exhausted, reaching latestConfirmedHash only proves
      // that head is up to date — the historical continuity gap down to target is still pending
      const pending = context.state.newTxCatchUp
      if (pending && pending.node === node && pending.exhausted) {
        context.commit('newTxCatchUp', { target, cursor: undefined, node, exhausted: true })
      } else {
        context.commit('newTxCatchUp', null)
      }
    } else if (outcome === 'budget') {
      context.commit('newTxCatchUp', { target, cursor, node })
    } else {
      // outcome is 'exhausted' or 'cycled':
      // This node cannot prove continuity towards target (either pruned or reorged).
      // Mark as exhausted on this node so subsequent refreshes on the same node do not
      // repeat the walk, while keeping target so a different node can attempt catch-up on failover.
      context.commit('newTxCatchUp', { target, cursor: undefined, node, exhausted: true })
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
    customActions
  })
}
