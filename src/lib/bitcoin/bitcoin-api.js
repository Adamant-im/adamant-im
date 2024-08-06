import BtcBaseApi from './btc-base-api'
import { Cryptos } from '../constants'
import { btcIndexer } from '../../lib/nodes'

export default class BitcoinApi extends BtcBaseApi {
  constructor(passphrase) {
    super(Cryptos.BTC, passphrase)
  }

  /**
   * @override
   */
  getBalance() {
    return this._get(`/address/${this.address}`).then(
      (data) => (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / this.multiplier
    )
  }

  /** @override */
  getFee() {
    return 0
  }

  /** Returns last block height */
  getHeight() {
    return this._get('/blocks/tip/height').then((data) => Number(data) || 0)
  }

  /** @override */
  sendTransaction(txHex) {
    return btcIndexer
      .useClient((client) => client.post('/tx', txHex))
      .then((response) => response.data)
  }

  /** @override */
  getTransaction(txid) {
    return this._get(`/tx/${txid}`).then((x) => this._mapTransaction(x))
  }

  /** @override */
  getTransactions({ toTx = '' }) {
    let url = `/address/${this.address}/txs`
    if (toTx) {
      url += `/chain/${toTx}`
    }
    return this._get(url).then((transactions) => transactions.map((x) => this._mapTransaction(x)))
  }

  /** @override */
  getTransactionHex(txid) {
    return this._get(`/tx/${txid}/hex`)
  }

  /** @override */
  getUnspents() {
    return this._get(`/address/${this.address}/utxo`).then((outputs) =>
      outputs.map((x) => ({ txid: x.txid, amount: x.value, vout: x.vout }))
    )
  }

  getFeeRate() {
    return this._get('/fee-estimates').then((estimates) => estimates['2'])
  }

  /** @override */
  _mapTransaction(tx) {
    const mapped = super._mapTransaction({
      ...tx,
      vin: tx.vin.map((x) => ({ ...x, addr: x.prevout.scriptpubkey_address })),
      vout: tx.vout.map((x) => ({
        ...x,
        scriptPubKey: { addresses: [x.scriptpubkey_address] }
      })),
      fees: tx.fee,
      time: tx.status.block_time,
      confirmations: tx.status.confirmed ? 1 : 0
    })

    mapped.amount /= this.multiplier
    mapped.fee /= this.multiplier
    mapped.height = tx.status.block_height

    return mapped
  }

  /** Executes a GET request to the API */
  _get(url, params) {
    return btcIndexer
      .useClient((client) => client.get(url, { params }))
      .then((response) => response.data)
  }
}
