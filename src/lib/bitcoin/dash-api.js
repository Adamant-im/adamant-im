import bitcoin from 'bitcoinjs-lib'
import BtcBaseApi from './btc-base-api'
import { Cryptos } from '../constants'

const getUnique = values => {
  const map = values.reduce((m, v) => {
    m[v] = 1
    return m
  }, { })
  return Object.keys(map)
}

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

    this._getInputAddress = this._getInputAddress.bind(this)
    this._getOutputAddress = this._getOutputAddress.bind(this)
  }

  /**
   * @override
   */
  getBalance () {
    return this._invoke('getaddressbalance', [this.address])
      .then(result => result.balance)
  }

  /** @override */
  getFee (amount) {
    return Math.floor(amount * 0.05)
  }

  /** @override */
  sendTransaction (txHex) {
    return this._invoke('sendrawtransaction', [txHex])
  }

  /** @override */
  _getUnspents () {
    return this._invoke('getaddressutxos', [this.address]).then(result => {
      if (!Array.isArray(result)) return []

      return result.map(x => ({
        txid: x.txid,
        amount: x.satoshis,
        vout: x.outputIndex
      }))
    })
  }

  /**
   * Invokes DASH JSON-RPC method.
   * @param {string} method method name
   * @param {object | Array<any>} params method params
   * @returns {Promise<any>} method result
   */
  _invoke (method, params) {
    return this._getClient().post({ method, params })
      .then(({ data }) => {
        if (data.error) throw new DashApiError(method, data.error)
        return data.result
      })
  }

  _parseTransaction (id, txHex) {
    const tx = bitcoin.Transaction.fromHex(txHex)

    const senders = getUnique(tx.ins.map(this._getInputAddress).filter(x => x))
    const recipients = getUnique(tx.outs.map(this._getOutputAddress).filter(x => x))

    return {
      id,
      hash: id,
      senders,
      recipients
    }
  }

  _getInputAddress (input) {
    try {
      // Inspired by https://github.com/dashevo/dashcore-lib/blob/v0.16.3/lib/script/script.js#L962
      const sig = bitcoin.script.decompile(input.script)
      const hash = bitcoin.crypto.ripemd160(bitcoin.crypto.sha256(sig[sig.length - 1]))
      const addr = bitcoin.address.toBase58Check(hash, this._network.pubKeyHash)
      return addr
    } catch (e) {
      // Don't care
      return ''
    }
  }

  _getOutputAddress (output) {
    try {
      const buf = Buffer.from(output.script, 3, 20)
      const addr = bitcoin.address.fromOutputScript(buf, this._network)
      return addr
    } catch (e) {
      // Never mind
      return ''
    }
  }
}
