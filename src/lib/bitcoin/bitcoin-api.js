import BtcBaseApi from './btc-base-api'
import { Cryptos } from '../constants'

export default class BitcoinApi extends BtcBaseApi {
  constructor (passphrase) {
    super(Cryptos.BTC, passphrase)
  }

  /**
   * @override
   */
  getBalance () {
    return this._get(`/address/${this.address}`).then(
      info => (info.funded_txo_sum - info.spent_txo_sum) / this.multiplier
    )
  }

  /** @override */
  getFee () {
    return 0
  }

  /** @override */
  sendTransaction (txHex) {
    return this._getClient().post('/tx', txHex).then(response => response.data)
  }

  /** @override */
  getTransaction (txid) {
    return this._get(`/tx/${txid}`).then(this._mapTransaction)
  }

  /** @override */
  getTransactions ({ toTx = '' }) {
    let url = `/address/${this.address}/txs`
    if (toTx) {
      url += `/chain/${toTx}`
    }
    return this._get(url).then(transactions => transactions.map(this._mapTransaction))
  }

  /** @override */
  getUnspents () {
    return this._get(`/address/${this.address}/utxo`).then(outputs =>
      outputs.map(x => ({ txid: x.txid, amount: x.value, vout: x.vout }))
    )
  }

  getFeeRate () {
    return this._get('/fee-estimates').then(estimates => estimates['2'])
  }

  /** @override */
  _mapTransaction (tx) {
    return super._mapTransaction({
      ...tx,
      vin: tx.vin.map(x => ({ ...x, addr: x.prevout.scriptpubkey_address })),
      vout: tx.vout.map(x => ({
        ...x,
        scriptPubKey: { addresses: [x.scriptpubkey_address] }
      })),
      fees: tx.fee,
      time: tx.status.block_time,
      confirmations: tx.status.confirmed ? 1 : 0
    })
  }

  /** Executes a GET request to the API */
  _get (url, params) {
    return this._getClient().get(url, params).then(response => response.data)
  }
}
