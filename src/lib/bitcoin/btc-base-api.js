import bitcoin from 'bitcoinjs-lib'
import axios from 'axios'

import networks from './networks'
import getEnpointUrl from '../getEndpointUrl'

export default class BtcBaseApi {
  constructor (crypto, passphrase) {
    const network = this._network = networks[crypto]

    const pwHash = bitcoin.crypto.sha256(Buffer.from(passphrase))
    this._keyPair = bitcoin.ECPair.fromPrivateKey(pwHash, { network })
    this._address = bitcoin.payments.p2pkh({ pubkey: this._keyPair.publicKey, network }).address
    this._clients = { }
    this._crypto = crypto
  }

  get multiplier () {
    return 1e8
  }

  get address () {
    return this._address
  }

  /**
   * Retrieves current balance
   * @abstract
   * @returns {Promise<number>}
   */
  getBalance () {
    return Promise.resolve(0)
  }

  /**
   * Returns transaction fee
   * @abstract
   * @param {number} amount transfer amount (satoshis)
   * @returns {number}
   */
  getFee (amount) {
    return 0
  }

  /**
   * Creates a transfer transaction hex and ID
   * @param {string} address receiver address
   * @param {number} amount amount to transfer (coins, not satoshis)
   * @returns {Promise<{hex: string, txid: string}>}
   */
  createTransaction (address = '', amount = 0) {
    return this._getUnspents().then(unspents => {
      const hex = this._buildTransaction(address, amount, unspents)

      let txid = bitcoin.crypto.sha256(Buffer.from(hex, 'hex'))
      txid = bitcoin.crypto.sha256(Buffer.from(txid))
      txid = txid.toString('hex').match(/.{2}/g).reverse().join('')

      return { hex, txid }
    })
  }

  /**
   * Broadcasts the specified transaction to the network.
   * @abstract
   * @param {string} txHex raw transaction as a HEX literal
   */
  sendTransaction (txHex) {
    return Promise.resolve('')
  }

  /**
   * Retrieves transaction details
   * @abstract
   * @param {*} txid transaction ID
   * @returns {Promise<object>}
   */
  getTransaction (txid) {
    return Promise.resolve(null)
  }

  /**
   * Retrieves transactions for the specified address
   * @abstract
   * @param {number=} from retrieve transactions starting from the specified position
   * @returns {Promise<{hasMore: boolean, items: Array}>}
   */
  getTransactions (from = 0) {
    return Promise.resolve({ hasMore: false, items: [] })
  }

  /**
   * Retrieves unspents (UTXO)
   * @abstract
   * @returns {Promise<Array<{txid: string, vout: number, amount: number}>>}
   */
  _getUnspents () {
    return Promise.resolve([])
  }

  /**
   * Creates a raw DOGE transaction as a hex string.
   * @param {string} address target address
   * @param {number} amount amount to send
   * @param {Array<{txid: string, amount: number, vout: number}>} unspents unspent transaction to use as inputs
   * @returns {string}
   */
  _buildTransaction (address, amount, unspents) {
    amount = Number(amount) * this.multiplier

    const txb = new bitcoin.TransactionBuilder(this._network)
    txb.setVersion(1)

    const target = amount + this.getFee(amount)
    let transferAmount = 0
    let inputs = 0

    unspents.forEach(tx => {
      const amt = Math.floor(tx.amount)
      if (transferAmount < target) {
        txb.addInput(tx.txid, tx.vout)
        transferAmount += amt
        inputs++
      }
    })

    txb.addOutput(address, amount)
    txb.addOutput(this._address, transferAmount - target)

    for (let i = 0; i < inputs; ++i) {
      txb.sign(i, this._keyPair)
    }

    return txb.build().toHex()
  }

  /** Picks a client for a random API endpoint */
  _getClient () {
    const url = getEnpointUrl(this._crypto)
    if (!this._clients[url]) {
      this._clients[url] = axios.create({
        baseURL: url
      })
    }
    return this._clients[url]
  }
}
