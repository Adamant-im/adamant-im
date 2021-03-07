import LskBaseApi from './lsk-base-api'
import { Cryptos } from '../constants'
import { getRealTimestamp } from './lisk-utils'
import { bytesToHex } from '@/lib/hex'
import * as cryptography from '@liskhq/lisk-cryptography'
import * as transactions from '@liskhq/lisk-transactions'

export const TX_FEE = 0.1

export default class LiskApi extends LskBaseApi {
  constructor (passphrase) {
    super(Cryptos.LSK, passphrase)
  }

  /** @override */
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

  /** @override */
  getHeight () {
    return this._get('/api/node/status').then(
      data => {
        // console.log(`/api/node/status:`, data)
        // console.log(`height:`, data.data.height)
        return Number(data.data.height) || 0
      })
  }

  /** @override */
  createTransaction (address = '', amount = 0, fee) {
    amount = transactions.utils.convertLSKToBeddows(amount.toString())
    var liskTx = transactions.transfer({
      amount,
      recipientId: address
      // data: 'Sent with ADAMANT Messenger'
    })
    liskTx.senderPublicKey = bytesToHex(this._keyPair.publicKey)
    liskTx.senderId = this._address

    // To use transactions.utils.signTransaction, passPhrase is necessary
    // So we'll use cryptography.signDataWithPrivateKey
    const liskTxBytes = transactions.utils.getTransactionBytes(liskTx)
    const txSignature = cryptography.signDataWithPrivateKey(cryptography.hash(liskTxBytes), this._keyPair.secretKey)
    liskTx.signature = txSignature
    var txid = transactions.utils.getTransactionId(liskTx)
    liskTx.id = txid

    // console.log('signed tx', liskTx)
    // console.log('Validate', transactions.utils.validateTransaction(liskTx))
    // console.log('VERIFY', transactions.utils.verifyTransaction(liskTx))
    return Promise.resolve({ hex: liskTx, txid })
  }

  /** @override */
  sendTransaction (signedTx) {
    // console.log('before sendTransaction:', signedTx)
    return this._getClient().post('/api/transactions', signedTx).then(response => {
      // console.log('sendTransaction:', response)
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
