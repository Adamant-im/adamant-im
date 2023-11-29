import { TRANSACTION_PARAMS_SCHEMA, TRANSACTION_SCHEMA } from '@/lib/lisk/lisk-schemas'
import LskBaseApi from './lsk-base-api'
import { Cryptos } from '../constants'
import {
  getMillisTimestamp,
  getLiskTimestamp,
  createUnsignedTransaction,
  encodeTransaction
} from './lisk-utils'
import { bytesToHex } from '@/lib/hex'
import * as cryptography from '@liskhq/lisk-cryptography'
import * as codec from '@liskhq/lisk-codec'
import * as transactions from '@liskhq/lisk-transactions'
import { lsk } from '@/lib/nodes/lsk'
import { getAccount } from './lisk-utils'

export const TX_CHUNK_SIZE = 25

export default class LiskApi extends LskBaseApi {
  constructor(passphrase) {
    super(Cryptos.LSK, passphrase)
    const account = getAccount(Cryptos.LSK, passphrase)
    this._network = account.network
    this._keyPair = account.keyPair
    this._address = account.address
    this._addressHexBinary = account.addressHexBinary
    this._addressHex = account.addressHex
    this._addressLegacy = account.addressLegacy
    this.passphrase = passphrase
  }

  /**
   * Get asset Id
   * @override
   */
  get assetId() {
    return 0
  }

  /**
   * Get asset schema
   * @override
   */
  get assetSchema() {
    return {
      $id: 'lisk/transfer-asset',
      title: 'Transfer transaction asset',
      type: 'object',
      required: ['amount', 'recipientAddress', 'data'],
      properties: {
        amount: {
          dataType: 'uint64',
          fieldNumber: 1
        },
        recipientAddress: {
          dataType: 'bytes',
          fieldNumber: 2,
          minLength: 20,
          maxLength: 20
        },
        data: {
          dataType: 'string',
          fieldNumber: 3,
          minLength: 0,
          maxLength: 64
        }
      }
    }
  }

  /** @override */
  getAccount() {
    return this._get(`/api/accounts/${this.addressHex}`, {}).then((data) => {
      const account = {}
      if (data && data.data && data.data.token && data.data.token.balance) {
        account.balance = data.data.token.balance / this.multiplier
      }
      if (data && data.data && data.data.sequence && data.data.sequence.nonce) {
        account.nonce = data.data.sequence.nonce
      }
      return account
    })
  }

  /** @override */
  getHeight() {
    return this._get('/api/node/info').then((data) => {
      return Number(data.data.height) || 0
    })
  }

  /**
   * Creates a transfer transaction hex (signed JSON tx object) and ID
   * Signed JSON tx object is ready for broadcasting to blockchain network
   * @override
   * @param {string} address receiver address in Base32 format
   * @param {number} amount amount to transfer (coins, not satoshis)
   * @param {number} fee transaction fee (coins, not satoshis)
   * @param {number} nonce transaction nonce
   * @param {string} data transaction data field
   * @returns {Promise<{hex: string, txid: string}>}
   */
  createTransaction(address = '', amount = 0, fee, nonce, data = '') {
    console.log(address, amount, fee, nonce, data)
    // throw new Error('stop2')
    // const unsignedTransaction = this._buildTransaction(address, amount, fee, nonce, data).liskTx // unsignedTx
    const unsignedTransaction = createUnsignedTransaction(
      address,
      Buffer.from(this._keyPair.publicKey).toString('hex'),
      amount,
      fee,
      nonce,
      data
    )

    // To use transactions.signTransaction, passPhrase is necessary
    // So we'll use cryptography.signDataWithPrivateKey
    console.log('liskTx', unsignedTransaction)

    const liskTxBytes = transactions.getSigningBytes(unsignedTransaction, TRANSACTION_PARAMS_SCHEMA)
    console.log('liskTxBytes', liskTxBytes)

    const signedTransaction = transactions.signTransaction(
      unsignedTransaction,
      this.networkIdentifier, // @todo or chainID?
      this._keyPair.secretKey,
      TRANSACTION_PARAMS_SCHEMA
    )
    console.log('signedTransaction', signedTransaction)

    // const json = toTransactionJSON(signedTransaction)

    // console.log('chainId', Buffer.from(this.chainId, 'hex'))
    // const networkIdTestnet = '15f0dacc1060e91818224a94286b13aa04279c640bd5d6f193182031d133df7c';
    // const signedTransaction = transactions.signTransaction(
    //   unsignedTransaction,
    //   Buffer.from(networkIdTestnet, 'hex'),
    //   this._keyPair.secretKey
    // )
    // console.log('passed', signedTransaction)

    const txid = bytesToHex(signedTransaction.id)

    const signeTransactionHex = {
      ...signedTransaction,
      id: txid,
      nonce: Number(signedTransaction.nonce).toString(),
      fee: Number(signedTransaction.fee).toString(),
      params: {
        ...signedTransaction.params,
        amount: Number(signedTransaction.params.amount).toString(),
        recipientAddress: Buffer.from(signedTransaction.params.recipientAddress).toString('hex'),
        tokenID: Buffer.from(signedTransaction.params.tokenID).toString('hex')
      },
      senderPublicKey: Buffer.from(signedTransaction.senderPublicKey).toString('hex'),
      signatures: signedTransaction.signatures.map((signature) =>
        Buffer.from(signature).toString('hex')
      )
    }

    console.log('txid', txid)

    console.log('signeTransactionHex', signeTransactionHex)
    console.log('encodeTransaction', encodeTransaction(signedTransaction))

    // throw new Error('stop')

    // To send Tx to node's core API, we should change data types
    // liskTx.senderPublicKey = bytesToHex(liskTx.senderPublicKey)
    // liskTx.nonce = nonce.toString()
    // liskTx.fee = transactions.convertLSKToBeddows((+fee).toFixed(this.decimals))
    // liskTx.asset.amount = transactions.convertLSKToBeddows((+amount).toFixed(this.decimals))
    // liskTx.asset.recipientAddress = bytesToHex(liskTx.asset.recipientAddress)
    // liskTx.signatures[0] = bytesToHex(txSignature)

    return Promise.resolve({ hex: encodeTransaction(signedTransaction), txid })
  }

  /** @override */
  sendTransaction(signedTx) {
    return lsk
      .getClient()
      .post('/api/transactions', signedTx)
      .then((response) => {
        return response.data.data.transactionId
      })
  }

  /** @override */
  getTransaction(txid) {
    return this._getService('/api/v2/transactions/', { transactionId: txid }).then((data) => {
      if (data && data.data[0]) {
        return this._mapTransaction(data.data[0])
      }
    })
  }

  /** @override */
  getTransactions(options = {}) {
    const url = '/api/v2/transactions/'
    options.moduleAssetId = `${this.moduleId}:${this.assetId}`
    options.limit = TX_CHUNK_SIZE
    options.address = this.address
    // options.includePending = true // workaround on Lisk Gateway bug v0.5.0 https://github.com/LiskHQ/lisk-service/issues/883
    if (options.toTimestamp || options.fromTimestamp) {
      options.toTimestamp = options.toTimestamp || Date.now()
      options.fromTimestamp = options.fromTimestamp || 0
      options.timestamp = `${getLiskTimestamp(options.fromTimestamp) + 1}:${
        getLiskTimestamp(options.toTimestamp) - 1
      }`
    }
    delete options.toTimestamp
    delete options.fromTimestamp
    // additional options: offset, height, and others

    return (
      this._getService(url, options)
        .then((transactions) => {
          if (transactions && transactions.data) {
            const mappedTxs = transactions.data.map((tx) => this._mapTransaction(tx))
            return mappedTxs
          }
        })
        // Unfortunately, Lisk Service returns 404 for empty results
        // https://github.com/LiskHQ/lisk-service/issues/698
        .catch(() => {
          return []
        })
    )
  }

  /** @override */
  _mapTransaction(tx) {
    const mapped = super._mapTransaction({
      ...tx
    })

    mapped.amount /= this.multiplier
    mapped.fee /= this.multiplier
    mapped.timestamp = getMillisTimestamp(mapped.timestamp)

    return mapped
  }

  /** Executes a GET request to the node's core API */
  _get(url, params) {
    return lsk
      .getClient()
      .get(url, { params })
      .then((response) => response.data)
  }

  /** Executes a GET request to the Lisk Service API */
  _getService(url, params) {
    return this._getServiceClient()
      .get(url, { params })
      .then((response) => response.data)
  }
}
