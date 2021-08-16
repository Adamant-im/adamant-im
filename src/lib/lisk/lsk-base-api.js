import axios from 'axios'
import getEnpointUrl from '../getEndpointUrl'
import { isStringEqualCI } from '@/lib/textHelpers'

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

const createServiceClient = url => {
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

  /**
   * Get Token/Send module Id
   * @returns {number}
   */
  get moduleId () {
    return 2
  }

  /**
   * Get asset Id
   * @abstract
   * @returns {number}
   */
  get assetId () {
    return undefined
  }

  get address () {
    return this._address
  }

  get addressHex () {
    return this._addressHex
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

  /** Picks a LSK node's (core) client for a random API endpoint */
  _getClient () {
    const url = getEnpointUrl(this._crypto)
    if (!this._clients[url]) {
      this._clients[url] = createClient(url)
    }
    return this._clients[url]
  }

  /** Picks a Lisk Service client for a random API endpoint */
  _getServiceClient () {
    const url = getEnpointUrl(this._crypto + 'service')
    if (!this._clients[url]) {
      this._clients[url] = createServiceClient(url)
    }
    return this._clients[url]
  }

  _mapTransaction (tx) {
    const direction = isStringEqualCI(tx.sender.address, this._address) ? 'from' : 'to'
    // no confirmations field
    // additional data: asset, receivedAt, blockId, height, type, recipientPublicKey, senderSecondPublicKey
    return {
      id: tx.id,
      hash: tx.id,
      fee: tx.fee,
      status: tx.height ? 'CONFIRMED' : 'REGISTERED',
      data: tx.asset.data,
      timestamp: tx.block.timestamp,
      direction,
      senderId: tx.sender.address,
      recipientId: tx.asset.recipient.address,
      amount: tx.asset.amount,
      confirmations: tx.confirmations,
      height: tx.height,
      nonce: tx.nonce,
      moduleId: tx.moduleAssetId.split(':')[0],
      assetId: tx.moduleAssetId.split(':')[1],
      moduleName: tx.moduleAssetName.split(':')[0],
      assetName: tx.moduleAssetName.split(':')[1]
    }
  }
}
