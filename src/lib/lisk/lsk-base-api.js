import axios from 'axios'
import getEnpointUrl from '../getEndpointUrl'
import { isStringEqualCI } from '@/lib/textHelpers'
import * as cryptography from '@liskhq/lisk-cryptography'
import * as transactions from '@liskhq/lisk-transactions'
import { CryptosInfo } from '../constants'

export const TX_DEFAULT_FEE = 0.00160

const createClient = url => {
  const client = axios.create({ baseURL: url })
  client.interceptors.response.use(null, error => {
    if (error.response && Number(error.response.status) >= 500) {
      console.error(`Request to ${url} failed.`, error)
    }
    // Lisk is spamming with 404 in console, when there is no LSK account
    // There is no way to disable 404 logging for Chrome
    if (error.response && Number(error.response.status) === 404) {
      if (
        error.response.data &&
        error.response.data.errors &&
        error.response.data.errors[0] &&
        error.response.data.errors[0].message &&
        error.response.data.errors[0].message.includes('was not found')
      ) {
        return error.response
      }
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

  get decimals () {
    return CryptosInfo[this._crypto].decimals
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
   * Get asset schema
   * @abstract
   * @returns {object} JSON schema
   */
  get assetSchema () {
    return { }
  }

  get networkIdentifier () {
    // Testnet: '15f0dacc1060e91818224a94286b13aa04279c640bd5d6f193182031d133df7c'
    // Mainnet: '4c09e6a781fc4c7bdb936ee815de8f94190f8a7519becd9de2081832be309a99'
    const networkIdentifier = '4c09e6a781fc4c7bdb936ee815de8f94190f8a7519becd9de2081832be309a99'
    return Buffer.from(networkIdentifier, 'hex')
  }

  /**
   * Retrieves current balance and nonce
   * @abstract
   * @returns {Promise<number>}
   */
  getAccount () {
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
   * Calculates fee for a Tx
   * @abstract
   * @returns {BigInt}
   */
  getFee (address = '', amount = 0, nonce, data = '') {
    const tx = this._buildTransaction(address, amount, TX_DEFAULT_FEE, nonce, data)
    return tx && tx.minFee ? tx.minFee : TX_DEFAULT_FEE
  }

  /**
   * Creates an LSK-based transaction as an object with specific types
   * @returns {object}
   */
  _buildTransaction (address, amount, fee, nonce, data = '') {
    const amountString = transactions.convertLSKToBeddows((+amount).toFixed(this.decimals))
    const feeString = transactions.convertLSKToBeddows((+fee).toFixed(this.decimals))
    const nonceString = nonce.toString()
    const liskTx = {
      moduleID: this.moduleId,
      assetID: this.assetId,
      nonce: BigInt(nonceString),
      fee: BigInt(feeString),
      asset: {
        amount: BigInt(amountString),
        recipientAddress: cryptography.getAddressFromBase32Address(address),
        data
        // data: 'Sent with ADAMANT Messenger'
      },
      signatures: []
    }
    liskTx.senderPublicKey = this._keyPair.publicKey
    const minFee = Number(transactions.computeMinFee(this.assetSchema, liskTx)) / this.multiplier

    return { liskTx, minFee }
  }

  /**
   * Creates a transfer transaction hex (signed JSON tx object) and ID
   * Signed JSON tx object is ready for broadcasting to blockchain network
   * @abstract
   * @param {string} address receiver address in Base32 format
   * @param {number} amount amount to transfer (coins, not satoshis)
   * @param {number} fee transaction fee (coins, not satoshis)
   * @param {number} nonce transaction nonce
   * @param {string} data transaction data field
   * @returns {Promise<{hex: string, txid: string}>}
   */
  createTransaction (address = '', amount = 0, fee, nonce, data) {
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
