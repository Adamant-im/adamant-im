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

/**
 * The newest transaction a history page can actually contain.
 *
 * `sortedTransactions[0]` may be a locally created record the indexer has never
 * seen, and looking for it in the pages would walk the whole history on every
 * refresh tick without ever finding it
 */
const latestIndexedTxId = (context) => {
  const latest = context.getters.sortedTransactions.find((tx) =>
    INDEXER_STATUSES.includes(tx.status)
  )

  return latest && latest.txid
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
 * Walks history back until `latestTxId` shows up again, which is what proves the
 * newly fetched records join the history already in the store.
 *
 * The indexer is paged by "everything older than this txid", which is not a
 * monotonic cursor: a stale or misbehaving node can cycle pages (`A -> B -> A`)
 * without ever repeating the immediately preceding cursor. Every visited cursor
 * is therefore remembered, and the walk is bounded by a page cap on top of that.
 *
 * @returns `{ complete }`, and the cursor to resume from when it is not
 */
const retrieveNewTransactions = async (context, latestTxId, startCursor) => {
  const visitedCursors = new Set()
  let toTx = startCursor

  for (let page = 0; page < MAX_NEW_TX_PAGES; page++) {
    const transactions = await btcIndexer.getTransactions(context.state.address, toTx)

    // An empty page means the chain has no more transactions to scan:
    // the latest locally known tx is gone (dropped from mempool, reorg)
    if (transactions.length === 0) return { complete: true }

    context.commit('transactions', transactions)

    // History is continuous again: the known transaction is in the page
    if (!latestTxId || transactions.some((x) => x.txid === latestTxId)) return { complete: true }

    const oldest = transactions[transactions.length - 1]
    if (!oldest || !oldest.txid) return { complete: true }

    // A cursor seen before means the node is cycling pages instead of paging back
    if (visitedCursors.has(oldest.txid)) return { complete: true }

    visitedCursors.add(oldest.txid)
    toTx = oldest.txid
  }

  // Out of page budget with the gap still open
  return { complete: false, cursor: toTx }
}

const getNewTransactions = async (api, context) => {
  context.commit('areRecentLoading', true)

  // A walk stopped by the page cap keeps its own target and cursor: the target
  // cannot be recomputed once its own pages are in the store, because the newest
  // record would then be one of them and the very first page would end the walk,
  // leaving the gap down to the previously known history unloaded forever
  const pending = context.state.newTxCatchUp
  const target = pending ? pending.target : latestIndexedTxId(context)
  const startCursor = pending ? pending.cursor : undefined

  const { complete, cursor } = await retrieveNewTransactions(context, target, startCursor)

  context.commit('newTxCatchUp', complete ? null : { target, cursor })
  context.commit('areRecentLoading', false)
}

const getOldTransactions = async (api, context) => {
  // If we already have the most old transaction for this address, no need to request anything
  if (context.state.bottomReached) return Promise.resolve()

  const transactions = context.getters.sortedTransactions
  const oldestTx = transactions[transactions.length - 1]
  const toTx = oldestTx && oldestTx.txid

  context.commit('areOlderLoading', true)
  const chunk = await btcIndexer.getTransactions(context.state.address, toTx)
  context.commit('transactions', chunk)
  context.commit('areOlderLoading', false)

  if (chunk.length < TX_CHUNK_SIZE) {
    context.commit('bottom', true)
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
