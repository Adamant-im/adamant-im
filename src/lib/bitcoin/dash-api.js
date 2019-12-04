import BtcBaseApi from './btc-base-api'
import { Cryptos } from '../constants'

/** Fee for sending tokens */
export const TX_FEE = 0.0001

class DashApiError extends Error {
  constructor (method, error) {
    super('Dash API returned an error')

    this.code = 'DASH_API'
    this.jsonMethod = method
    this.details = error

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DashApiError)
    }
  }
}

export default class DashApi extends BtcBaseApi {
  constructor (passphrase) {
    super(Cryptos.DASH, passphrase)
  }

  /**
   * @override
   */
  getBalance () {
    return this._invoke('getaddressbalance', [this.address])
      .then(result => Number(result.balance) / this.multiplier)
  }

  getFee () {
    return TX_FEE
  }

  /** @override */
  sendTransaction (txHex) {
    return this._invoke('sendrawtransaction', [txHex])
  }

  /** @override */
  getTransaction (txid) {
    return this._invoke('getrawtransaction', [txid, true])
      .then(result => this._mapTransaction(result))
  }

  /** @override */
  getTransactions (options) {
    return this._invoke('getaddresstxids', [this._address])
      .then(txids => {
        const excludes = options.excludes || []
        return txids
          .filter(x => !excludes.includes(x))
          .map(x => ({
            method: 'getrawtransaction',
            params: [x, true]
          }))
      })
      .then(calls => this._invokeMany(calls))
      .then(results => results
        .filter(x => !x.error && x.result)
        .map(x => this._mapTransaction(x.result))
      )
      .then(items => ({ hasMore: false, items }))
  }

  /** @override */
  getUnspents () {
    return this._invoke('getaddressutxos', [this.address]).then(result => {
      if (!Array.isArray(result)) return []

      return result.map(x => ({
        txid: x.txid,
        amount: x.satoshis,
        vout: x.outputIndex
      }))
    })
  }

  /** @override */
  _mapTransaction (tx) {
    return super._mapTransaction({
      ...tx,
      vin: tx.vin.map(x => ({ ...x, addr: x.address }))
    })
  }

  /**
   * Invokes DASH JSON-RPC method.
   * @param {string} method method name
   * @param {object | Array<any>} params method params
   * @returns {Promise<any>} method result
   */
  _invoke (method, params) {
    return this._getClient().post('/', { method, params })
      .then(({ data }) => {
        if (data.error) throw new DashApiError(method, data.error)
        return data.result
      })
  }

  _invokeMany (calls) {
    return this._getClient().post('/', calls)
      .then(response => response.data)
  }
}
