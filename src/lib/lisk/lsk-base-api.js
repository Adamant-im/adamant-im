import pbkdf2 from 'pbkdf2'
import sodium from 'sodium-browserify-tweetnacl'
import { getAddressFromPublicKey } from '@liskhq/lisk-cryptography'

import axios from 'axios'
import networks from './networks'
import getEnpointUrl from '../getEndpointUrl'

export const LiskHashSettings = {
  SALT: 'adm',
  ITERATIONS: 2048,
  KEYLEN: 32,
  DIGEST: 'sha256'
}

const createClient = url => {
  const client = axios.create({ baseURL: url })
  client.interceptors.response.use(null, error => {
    if (error.response && Number(error.response.status) >= 500) {
      console.error('Request failed', error)
    }
    // console.log('axios client fine:', url)
    return Promise.reject(error)
  })
  return client
}

export function getAccount (crypto, passphrase) {
  const network = networks[crypto]
  var liskSeed = pbkdf2.pbkdf2Sync(passphrase, LiskHashSettings.SALT, LiskHashSettings.ITERATIONS, LiskHashSettings.KEYLEN, LiskHashSettings.DIGEST)
  var keyPair = sodium.crypto_sign_seed_keypair(liskSeed)
  var address = getAddressFromPublicKey(keyPair.publicKey)
  // console.log('address-1', address)
  return {
    network,
    keyPair,
    address
  }
}

export default class LskBaseApi {
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

  /**
   * Retrieves current balance
   * @abstract
   * @returns {Promise<number>}
   */
  getBalance () {
    return Promise.resolve(0)
  }

  /**
   * Returns last block height
   * @abstract
   * @returns {Promise<number>}
   */
  getHeight () {
    return Promise.resolve(0)
  }

  /**
   * Creates a transfer transaction hex (signed JSON tx object) and ID
   * Signed JSON tx object is ready for broadcasting to blockchain network
   * @abstract
   * @param {string} address receiver address
   * @param {number} amount amount to transfer (coins, not satoshis)
   * @param {number} fee transaction fee (coins, not satoshis)
   * @returns {Promise<{hex: string, txid: string}>}
   */
  createTransaction (address = '', amount = 0, fee) {
    return Promise.resolve({ hex: undefined, txid: undefined })
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

  /** Picks a client for a random API endpoint */
  _getClient () {
    const url = getEnpointUrl(this._crypto)
    if (!this._clients[url]) {
      this._clients[url] = createClient(url)
    }
    return this._clients[url]
  }

  _mapTransaction (tx) {
    const direction = tx.senderId === this._address ? 'from' : 'to'
    // additional data: asset, receivedAt, blockId, height, type, recipientPublicKey, senderSecondPublicKey
    return {
      id: tx.id,
      hash: tx.id,
      fee: tx.fee,
      status: tx.confirmations > 0 ? 'SUCCESS' : 'REGISTERED',
      timestamp: tx.timestamp,
      direction,
      // senders,
      senderId: tx.senderId,
      // recipients,
      recipientId: tx.recipientId,
      amount: tx.amount,
      confirmations: tx.confirmations,
      height: tx.height
    }
  }
}
