import LskBaseApi from './lsk-base-api'
import { Cryptos } from '../constants'
import { getRealTimestamp } from './lisk-utils'

export const TX_FEE = 0.1

export default class LiskApi extends LskBaseApi {
  constructor (passphrase) {
    super(Cryptos.LSK, passphrase)
  }

  /**
   * @override
   */
  getBalance () {
    return this._get(`/api/accounts`, { address: this.address }).then(
      data => {
        // console.log(`/api/accounts:`, data)
        return (data.data[0].balance) / this.multiplier
      })
  }

  /** @override */
  getFee () {
    return TX_FEE
  }

  /** Returns last block height */
  getHeight () {
    return this._get('/api/node/status').then(
      data => {
        // console.log(`/api/node/status:`, data)
        // console.log(`height:`, data.data.height)
        return Number(data.data.height) || 0
      })
  }

  /** @override */
  sendTransaction (signedTx) {
    // console.log('before sendTransaction:', signedTx)
    return this._getClient().post('/api/transactions', signedTx).then(response => {
      console.log('sendTransaction:', response)
      return signedTx.id
    })
  }

  /** @override */
  getTransaction (txid) {
    return this._get(`/api/transactions`, { id: txid }).then(data => {
      // console.log(`/api/transactions txid:`, data)
      // console.log(`tx:`, data.data[0])
      return this._mapTransaction(data.data[0])
    })
  }

  /** @override */
  getTransactions (options = { }) {
    let url = `/api/transactions`
    options.limit = 25
    options.sort = 'timestamp:desc'
    options.type = 0
    options.senderIdOrRecipientId = this.address
    // additional options: offset, toTimestamp, fromTimestamp, height
    return this._get(url, options).then(transactions => {
      // console.log(transactions)
      var mappedTxs = transactions.data.map(tx => this._mapTransaction(tx))
      // console.log(mappedTxs)
      return mappedTxs
    })
  }

  /** @override */
  // getUnspents () {
  //   return this._get(`/address/${this.address}/utxo`).then(outputs =>
  //     outputs.map(x => ({ txid: x.txid, amount: x.value, vout: x.vout }))
  //   )
  // }

  // getFeeRate () {
  //   return this._get('/fee-estimates').then(estimates => estimates['2'])
  // }

  /** @override */
  _mapTransaction (tx) {
    const mapped = super._mapTransaction({
      ...tx
    })

    mapped.amount /= this.multiplier
    mapped.fee /= this.multiplier
    mapped.timestamp = getRealTimestamp(mapped.timestamp)

    return mapped
  }

  /** Executes a GET request to the API */
  _get (url, params) {
    // console.log('_get ', url, 'params:', params)
    return this._getClient().get(url, { params }).then(response => response.data)
  }
}
