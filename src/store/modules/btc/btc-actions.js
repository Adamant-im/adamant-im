import baseActions from '../btc-base/btc-base-actions'
import BtcApi from '../../../lib/bitcoin/bitcoin-api'

const customActions = getApi => ({
  updateStatus (context) {
    const api = getApi()

    if (!api) return
    api.getBalance().then(balance => context.commit('status', { balance }))

    // The unspent transactions are needed to estimate the fee
    api.getUnspents().then(utxo => context.commit('utxo', utxo))

    // The estimated fee rate is also needed
    api.getFeeRate().then(rate => context.commit('feeRate', rate))
  }
})

export default {
  ...baseActions({
    apiCtor: BtcApi,
    getOldTransactions: null,
    getNewTransactions: null,
    customActions
  })
}
