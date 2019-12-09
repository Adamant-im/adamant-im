import baseActions from '../btc-base/btc-base-actions'
import BtcApi from '../../../lib/bitcoin/bitcoin-api'

const TX_CHUNK_SIZE = 25

const customActions = getApi => ({
  updateStatus (context) {
    const api = getApi()

    if (!api) return
    api.getBalance().then(balance => context.commit('status', { balance }))

    // The unspent transactions are needed to estimate the fee
    api.getUnspents().then(utxo => context.commit('utxo', utxo))

    // The estimated fee rate is also needed
    api.getFeeRate().then(rate => context.commit('feeRate', rate))

    // Last block height
    api.getHeight().then(height => context.commit('height', height))
  }
})

const retrieveNewTransactions = async (api, context, latestTxId, toTx) => {
  const transactions = await api.getTransactions({ toTx })
  context.commit('transactions', transactions)

  if (latestTxId && !transactions.some(x => x.txid === latestTxId)) {
    const oldest = transactions[transactions.length - 1]
    await getNewTransactions(api, context, latestTxId, oldest && oldest.txid)
  }
}

const getNewTransactions = async (api, context) => {
  // Determine the most recent transaction ID
  const latestTransaction = context.getters['sortedTransactions'][0]
  const latestId = latestTransaction && latestTransaction.txid
  // Now fetch the transactions until we meet that latestId among the
  // retrieved results
  await retrieveNewTransactions(api, context, latestId)
}

const getOldTransactions = async (api, context) => {
  const transactions = context.getters['sortedTransactions']
  const oldestTx = transactions[transactions.length - 1]
  const toTx = oldestTx && oldestTx.txid

  const chunk = await api.getTransactions({ toTx })
  context.commit('transactions', chunk)

  if (chunk.length < TX_CHUNK_SIZE) {
    context.commit('bottom')
  }
}

export default {
  ...baseActions({
    apiCtor: BtcApi,
    getOldTransactions,
    getNewTransactions,
    customActions,
    maxFetchAttempts: 180,
    oldTxFetchTimeout: 10
  })
}
