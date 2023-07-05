import * as bitcoin from 'bitcoinjs-lib'
import axios from 'axios'

import networks from './networks'
import getEnpointUrl from '../getEndpointUrl'
import BigNumber from '../bignumber'
import { isPositiveNumber } from '@/lib/numericHelpers'
import { CryptosInfo } from '../constants'

const getUnique = values => {
  const map = values.reduce((m, v) => {
    m[v] = 1
    return m
  }, { })
  return Object.keys(map)
}

const createClient = url => {
  const client = axios.create({ baseURL: url })
  client.interceptors.response.use(null, error => {
    if (error.response && Number(error.response.status) >= 500) {
      console.error('Request failed', error)
    }
    return Promise.reject(error)
  })
  return client
}

export function getAccount (crypto, passphrase) {
  const network = networks[crypto]
  const pwHash = bitcoin.crypto.sha256(Buffer.from(passphrase))
  const keyPair = bitcoin.ECPair.fromPrivateKey(pwHash, { network })

  return {
    network,
    keyPair,
    address: bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network }).address
  }
}

export default class BtcBaseApi {
  constructor (crypto, passphrase) {
    const account = getAccount(crypto, passphrase)

    this._network = account.network
    this._keyPair = account.keyPair
    this._address = account.address
    this._clients = { }
    this._crypto = crypto
  }

  get multiplier () {
    return 1e8
  }

  get address () {
    return this._address
  }

  /** Fee for sending tokens */
  getFee() {
    return CryptosInfo[this._crypto].fixedFee
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
   * Creates a transfer transaction hex and ID
   * @param {string} address receiver address
   * @param {number} amount amount to transfer (coins, not satoshis)
   * @param {number} fee transaction fee (coins, not satoshis)
   * @returns {Promise<{hex: string, txid: string}>}
   */
  createTransaction (address = '', amount = 0, fee) {
    return this.getUnspents().then(unspents => {
      const hex = this._buildTransaction(address, amount, unspents, fee)

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
   * @param {any} options crypto-specific options
   * @returns {Promise<{hasMore: boolean, items: Array}>}
   */
  getTransactions (options) {
    return Promise.resolve({ hasMore: false, items: [] })
  }

  /**
   * Retrieves unspents (UTXO)
   * @abstract
   * @returns {Promise<Array<{txid: string, vout: number, amount: number}>>}
   */
  getUnspents () {
    return Promise.resolve([])
  }

  /**
   * Creates a raw BTC-based transaction as a hex string.
   * @param {string} address target address
   * @param {number} amount amount to send
   * @param {Array<{txid: string, amount: number, vout: number}>} unspents unspent transaction to use as inputs
   * @param {number} fee transaction fee in primary units (BTC, DOGE, DASH, etc)
   * @returns {string}
   */
  _buildTransaction (address, amount, unspents, fee) {
    amount = new BigNumber(amount).times(this.multiplier).toNumber()
    amount = Math.floor(amount)

    const txb = new bitcoin.TransactionBuilder(this._network)
    txb.setVersion(1)

    const target = amount + new BigNumber(fee).times(this.multiplier).toNumber()
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

    txb.addOutput(bitcoin.address.toOutputScript(address, this._network), amount)
    // This is a necessary step
    // If we'll not add a change to output, it will burn in hell
    const change = transferAmount - target
    if (isPositiveNumber(change)) {
      txb.addOutput(this._address, change)
    }

    for (let i = 0; i < inputs; ++i) {
      txb.sign(i, this._keyPair)
    }

    return txb.build().toHex()
  }

  /** Picks a client for a random API endpoint */
  _getClient () {
    const url = getEnpointUrl(this._crypto)
    if (!this._clients[url]) {
      this._clients[url] = createClient(url)
    }
    return this._clients[url]
  }

  _mapTransaction (tx) {
    // Remove курьи txs like "possibleDoubleSpend" and txs without info
    if (tx.possibleDoubleSpend || (!tx.txid && !tx.time && !tx.valueIn && !tx.vin)) return

    const addressField = tx.vin[0].address ? 'address' : 'addr'
    const senders = getUnique(tx.vin.map(input => input[addressField])).filter(sender => sender !== undefined && sender !== 'undefined')

    const direction = senders.includes(this._address) ? 'from' : 'to'

    const recipients = getUnique(tx.vout.reduce((list, out) => {
      list.push(...out.scriptPubKey.addresses)
      return list
    }, [])).filter(recipient => recipient !== undefined && recipient !== 'undefined')

    if (direction === 'from') {
      // Disregard our address for an outgoing transaction unless it's the only address (i.e. we're sending to ourselves)
      const idx = recipients.indexOf(this._address)
      if (idx >= 0 && recipients.length > 1) recipients.splice(idx, 1)
    }

    if (direction === 'to' && senders.length === 1) {
      // Disregard the only sender address for an incoming transaction unless it's the only address (i.e. we're sending to ourselves)
      const idx = recipients.indexOf(senders[0])
      if (idx >= 0 && recipients.length > 1) recipients.splice(idx, 1)
    }

    let senderId, recipientId
    if (direction === 'from') {
      senderId = this._address
      recipientId = recipients.length === 1 ? recipients[0] : undefined
    } else {
      senderId = senders.length === 1 ? senders[0] : undefined
      recipientId = this._address
    }

    // Calculate amount from outputs:
    // * for the outgoing transactions take outputs that DO NOT target us
    // * for the incoming transactions take outputs that DO target us
    const amount = tx.vout.reduce((sum, t) =>
      ((direction === 'to') === (t.scriptPubKey.addresses.includes(this._address)) ? sum + Number(t.value) : sum), 0)

    const confirmations = tx.confirmations
    const timestamp = tx.time ? tx.time * 1000 : undefined

    let fee = tx.fees
    if (!fee) {
      const totalIn = tx.vin.reduce((sum, x) => sum + (x.value ? +x.value : 0), 0)
      const totalOut = tx.vout.reduce((sum, x) => sum + (x.value ? +x.value : 0), 0)
      fee = totalIn - totalOut
    }

    const height = tx.height

    return {
      id: tx.txid,
      hash: tx.txid,
      fee,
      status: confirmations > 0 ? 'CONFIRMED' : 'REGISTERED',
      timestamp,
      direction,
      senders,
      senderId,
      recipients,
      recipientId,
      amount,
      confirmations,
      height,
      instantlock: tx.instantlock,
      instantlock_internal: tx.instantlock_internal,
      instantsend: tx.instantlock
    }
  }
}
