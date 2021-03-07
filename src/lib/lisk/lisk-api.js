import LskBaseApi from './lsk-base-api'
import { Cryptos } from '../constants'
import { getRealTimestamp } from './lisk-utils'
import { bytesToHex } from '@/lib/hex'
import * as cryptography from '@liskhq/lisk-cryptography'
import * as transactions from '@liskhq/lisk-transactions'
import pbkdf2 from 'pbkdf2'
import sodium from 'sodium-browserify-tweetnacl'
import networks from './networks'

export const LiskHashSettings = {
  SALT: 'adm',
  ITERATIONS: 2048,
  KEYLEN: 32,
  DIGEST: 'sha256'
}

export const TX_FEE = 0.1

export function getAccount (crypto, passphrase) {
  const network = networks[crypto]
  var liskSeed = pbkdf2.pbkdf2Sync(passphrase, LiskHashSettings.SALT, LiskHashSettings.ITERATIONS, LiskHashSettings.KEYLEN, LiskHashSettings.DIGEST)
  var keyPair = sodium.crypto_sign_seed_keypair(liskSeed)
  var address = cryptography.getAddressFromPublicKey(keyPair.publicKey)
  // console.log('address-1', address)
  return {
    network,
    keyPair,
    address
  }
}

export default class LiskApi extends LskBaseApi {
  constructor (passphrase) {
    super(Cryptos.LSK, passphrase)
    const account = getAccount(Cryptos.LSK, passphrase)
    this._network = account.network
    this._keyPair = account.keyPair
    this._address = account.address
  }

  /** @override */
  getBalance () {
    return this._get(`/api/accounts`, { address: this.address }).then(
      data => {
        // console.log(`/api/accounts:`, data)
        if (data && data.data[0] && data.data[0].balance) {
          return (data.data[0].balance) / this.multiplier
        }
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
      if (data && data.data[0]) {
        return this._mapTransaction(data.data[0])
      }
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
      if (transactions && transactions.data) {
        var mappedTxs = transactions.data.map(tx => this._mapTransaction(tx))
        // console.log(mappedTxs)
        return mappedTxs
      }
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
