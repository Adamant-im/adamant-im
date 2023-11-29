/**
 * Additional coin-based functions here
 */

import { TRANSACTION_PARAMS_SCHEMA, TRANSACTION_SCHEMA } from '@/lib/lisk/lisk-schemas'
import * as codec from '@liskhq/lisk-codec'
import * as cryptography from '@liskhq/lisk-cryptography'
import networks from '@/lib/lisk/networks'
import { getLisk32AddressFromPublicKey } from '@liskhq/lisk-cryptography/dist-node/address'
import * as transactions from '@liskhq/lisk-transactions'
import { Buffer } from 'buffer'
import pbkdf2 from 'pbkdf2'
import sodium from 'sodium-browserify-tweetnacl'
import { LiskHashSettings } from './lisk-constants'
import { bytesToHex } from '@/lib/hex'
import * as validator from '@liskhq/lisk-validator'

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

/**
 * Creates unsigned LSK transaction.
 *
 * @param recipientAddress Recipient address (Lisk32 string hex format)
 * @param senderPublicKey Sender public key (string hex)
 * @param amount Amount of LSK to send
 * @param fee Transaction fee
 * @param nonce Last nonce
 * @param data A.k.a note
 */
export function createUnsignedTransaction(
  recipientAddress: string,
  senderPublicKey: string,
  amount: number | string,
  fee: number | string,
  nonce: number | string,
  data = ''
) {
  const decimals = 8

  console.log('address', recipientAddress)
  console.log('publicKeyHex', senderPublicKey)
  console.log('nonce', nonce)

  // throw new Error('stop')

  const amountString = transactions.convertLSKToBeddows((+amount).toFixed(decimals))
  const feeString = transactions.convertLSKToBeddows((+fee).toFixed(decimals))
  const nonceString = nonce.toString()

  // Adjust the values of the unsigned transaction manually
  const unsignedTransaction = {
    module: 'token',
    command: 'transfer',
    fee: BigInt(feeString),
    nonce: BigInt(nonceString),
    senderPublicKey: Buffer.from(senderPublicKey, 'hex'),
    params: Buffer.alloc(0),
    signatures: []
  }

  validator.validator.validate(TRANSACTION_SCHEMA, unsignedTransaction)

  // Create the asset for the Token Transfer transaction
  const transferParams = {
    tokenID: Buffer.from('0000000100000000', 'hex'),
    amount: BigInt(amountString),
    recipientAddress: cryptography.address.getAddressFromLisk32Address(recipientAddress),
    data
  }

  // Add the transaction params to the transaction object
  unsignedTransaction.params = transferParams

  // @todo remove
  // const minFee = Number(transactions.computeMinFee(this.assetSchema, liskTx)) / this.multiplier

  // only tx.params will be validated
  transactions.validateTransaction(unsignedTransaction, TRANSACTION_PARAMS_SCHEMA)

  // throw new Error('stop')

  return unsignedTransaction
}

/**
 * Encode transaction for later broadcasting to a node.
 */
export function encodeTransaction(signedTransaction: Record<string, unknown>) {
  const transaction = codec.codec.toJSON(TRANSACTION_SCHEMA, signedTransaction)
  const params = codec.codec.toJSON(TRANSACTION_PARAMS_SCHEMA, signedTransaction.params as object)

  return {
    ...transaction,
    params
  }
}
