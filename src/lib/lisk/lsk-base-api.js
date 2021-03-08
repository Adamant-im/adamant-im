import axios from 'axios'
import getEnpointUrl from '../getEndpointUrl'

const createClient = url => {
  const client = axios.create({ baseURL: url })
  client.interceptors.response.use(null, error => {
    if (error.response && Number(error.response.status) >= 500) {
      console.error(`Request to ${url} failed.`, error)
    }
    return Promise.reject(error)
  })
  return client
}

export default class LskBaseApi {
  /**
   * Constructor
   * @abstract
   */
  constructor (crypto, passphrase) {
    this._clients = { }
    this._crypto = crypto
    this._network = undefined
    this._keyPair = undefined
    this._address = undefined
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
      senderId: tx.senderId,
      recipientId: tx.recipientId,
      amount: tx.amount,
      confirmations: tx.confirmations,
      height: tx.height
    }
  }
}
