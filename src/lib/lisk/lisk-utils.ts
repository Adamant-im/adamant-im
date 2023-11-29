/**
 * Additional coin-based functions here
 */

import * as cryptography from '@liskhq/lisk-cryptography'
import networks from '@/lib/lisk/networks'
import * as transactions from '@liskhq/lisk-transactions'
import pbkdf2 from 'pbkdf2'
import sodium from 'sodium-browserify-tweetnacl'
import { LiskHashSettings } from './lisk-constants'
import { bytesToHex } from '@/lib/hex'

/**
 * Returns Millis timestamp by LSK UNIX timestamp (sec)
 * @param {number} liskTimestamp
 */
export function getMillisTimestamp(liskTimestamp: number) {
  return parseInt(liskTimestamp) * 1000
}

/**
 * Returns LSK timestamp (UNIX in sec) by Millis timestamp
 * @param {number} millisTimestamp
 */
export function getLiskTimestamp(millisTimestamp: number) {
  return Math.round(parseInt(millisTimestamp) / 1000) // may be a mistake (use Math.floor instead)
}

export function getAccount(crypto, passphrase) {
  const network = networks[crypto]
  const liskSeed = pbkdf2.pbkdf2Sync(
    passphrase,
    LiskHashSettings.SALT,
    LiskHashSettings.ITERATIONS,
    LiskHashSettings.KEYLEN,
    LiskHashSettings.DIGEST
  )
  const keyPair = sodium.crypto_sign_seed_keypair(liskSeed)
  const addressHexBinary = cryptography.address.getAddressFromPublicKey(keyPair.publicKey)
  const addressHex = bytesToHex(addressHexBinary)
  const address = cryptography.address.getLisk32AddressFromPublicKey(keyPair.publicKey)
  // Don't work currently https://github.com/LiskHQ/lisk-sdk/issues/6651
  // const addressLegacy = cryptography.getLegacyAddressFromPublicKey(keyPair.publicKey)
  // const addressLegacy = cryptography.getLegacyAddressFromPrivateKey(keyPair.secretKey)
  const addressLegacy = 'cryptography.getLegacyAddressFromPublicKey(bytesToHex(keyPair.publicKey))'
  return {
    network,
    keyPair,
    address,
    addressHexBinary,
    addressHex,
    addressLegacy
  }
}

// @todo derivate publicKey from address
export function createUnsignedTransaction(address: string, publicKey, amount, fee, nonce, data = '') {
  const decimals = 8

  const amountString = transactions.convertLSKToBeddows((+amount).toFixed(decimals))
  const feeString = transactions.convertLSKToBeddows((+fee).toFixed(decimals))
  const nonceString = nonce.toString()

  // Adjust the values of the unsigned transaction manually
  const unsignedTransaction = {
    module: 'token',
    command: 'transfer',
    fee: BigInt(feeString),
    nonce: BigInt(nonceString),
    senderPublicKey: Buffer.from(publicKey, 'hex'),
    params: Buffer.alloc(0),
    signatures: []
  }

  // Create the asset for the Token Transfer transaction
  const transferParams = {
    tokenID: Buffer.from('0000000100000000', 'hex'),
    amount: BigInt(amountString),
    recipientAddress: cryptography.address.getAddressFromLisk32Address(address),
    data
  }

  // Add the transaction params to the transaction object
  unsignedTransaction.params = transferParams

  // @todo remove
  // const minFee = Number(transactions.computeMinFee(this.assetSchema, liskTx)) / this.multiplier

  return unsignedTransaction
}

export function createOfflineTransaction() {

}
