import { FetchStatus } from '@/lib/constants'
import baseActions from '../btc-base/btc-base-actions'
import BtcApi from '../../../lib/bitcoin/bitcoin-api'
import { btcIndexer } from '../../../lib/nodes'
import { logger } from '@/utils/devTools/logger'

const TX_CHUNK_SIZE = 25

/**
 * Hard cap on pages walked back by a single `getNewTransactions` run. Anything
 * left over is picked up by the next refresh tick.
 */
const MAX_NEW_TX_PAGES = 20

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
 * Walks history back until the latest locally known transaction shows up again.
 *
 * The indexer is paged by "everything older than this txid", which is not a
 * monotonic cursor: a stale or misbehaving node can cycle pages (`A -> B -> A`)
 * without ever repeating the immediately preceding cursor. Every visited cursor
 * is therefore remembered, and the walk is bounded by a page cap on top of that.
 */
const retrieveNewTransactions = async (context, latestTxId) => {
  const visitedCursors = new Set()
  let toTx

  for (let page = 0; page < MAX_NEW_TX_PAGES; page++) {
    const transactions = await btcIndexer.getTransactions(context.state.address, toTx)

    // An empty page means the chain has no more transactions to scan:
    // the latest locally known tx is gone (dropped from mempool, reorg)
    if (transactions.length === 0) return

    context.commit('transactions', transactions)

    // History is continuous again: the locally known transaction is in the page
    if (!latestTxId || transactions.some((x) => x.txid === latestTxId)) return

    const oldest = transactions[transactions.length - 1]
    if (!oldest || !oldest.txid) return

    // A cursor seen before means the node is cycling pages instead of paging back
    if (visitedCursors.has(oldest.txid)) return

    visitedCursors.add(oldest.txid)
    toTx = oldest.txid
  }
}

const getNewTransactions = async (api, context) => {
  context.commit('areRecentLoading', true)
  // Determine the most recent transaction ID
  const latestTransaction = context.getters.sortedTransactions[0]
  const latestId = latestTransaction && latestTransaction.txid
  // Now fetch the transactions until we meet that latestId among the
  // retrieved results
  await retrieveNewTransactions(context, latestId)
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
