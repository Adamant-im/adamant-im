/**
 * Additional coin-based functions here
 */

import { CryptoSymbol } from '@/lib/constants/cryptos'
import { TRANSACTION_PARAMS_SCHEMA, TRANSACTION_SCHEMA } from '@/lib/lisk/lisk-schemas'
import { DecodedTransaction, Transaction } from './types/lisk'
import { codec } from '@liskhq/lisk-codec'
import * as cryptography from '@liskhq/lisk-cryptography'
import networks from '@/lib/lisk/networks'
import { computeMinFee, convertBeddowsToLSK, convertLSKToBeddows } from '@liskhq/lisk-transactions'
import * as transactions from '@liskhq/lisk-transactions'
import { Buffer } from 'buffer'
import pbkdf2 from 'pbkdf2'
import sodium from 'sodium-browserify-tweetnacl'
import {
  LiskHashSettings,
  LSK_CHAIN_ID,
  LSK_COMMAND_FEE,
  LSK_DECIMALS,
  LSK_DEMO_ACCOUNT,
  LSK_MIN_REQUIRED_FEE,
  LSK_TOKEN_ID
} from './lisk-constants'
import { bytesToHex } from '@/lib/hex'
import * as validator from '@liskhq/lisk-validator'

/**
 * Returns Millis timestamp by LSK UNIX timestamp (sec)
 * @param {number} liskTimestamp
 */
export function getMillisTimestamp(liskTimestamp: number | string) {
  return parseInt(liskTimestamp.toString()) * 1000
}

/**
 * Returns LSK timestamp (UNIX in sec) by Millis timestamp
 * @param {number} millisTimestamp
 */
export function getLiskTimestamp(millisTimestamp: number | string) {
  return Math.round(parseInt(millisTimestamp.toString()) / 1000) // may be a mistake (use Math.floor instead)
}

export function getAccount(crypto: CryptoSymbol, passphrase: string) {
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

export function seedLskAccount(passphrase: string) {
  const liskSeed = pbkdf2.pbkdf2Sync(
    passphrase,
    LiskHashSettings.SALT,
    LiskHashSettings.ITERATIONS,
    LiskHashSettings.KEYLEN,
    LiskHashSettings.DIGEST
  )
  const keyPair = sodium.crypto_sign_seed_keypair(liskSeed)

  const address = cryptography.address.getLisk32AddressFromPublicKey(keyPair.publicKey)
  const addressHexBinary = cryptography.address.getAddressFromPublicKey(keyPair.publicKey)
  const addressHex = bytesToHex(addressHexBinary)

  return {
    keyPair,
    address,
    addressHexBinary,
    addressHex
  }
}

/**
 * Create and sign a transfer transaction.
 * Transaction `hex` result is ready for broadcasting to blockchain network.
 *
 * @param keyPair Sender's `publicKey` and `privateKey`
 * @param address Receiver address in Lisk32 format
 * @param amount Amount to transfer (LSK, not Beddows)
 * @param fee Transaction fee (LSK, not Beddows)
 * @param nonce Transaction nonce
 * @param data Transaction data field
 */
export function createTransaction(
  keyPair: { publicKey: Buffer; secretKey: Buffer },
  address: string,
  amount: number | string,
  fee: number | string,
  nonce: number | string,
  data = ''
) {
  const unsignedTransaction = createUnsignedTransaction(
    address,
    Buffer.from(keyPair.publicKey).toString('hex'),
    amount,
    fee,
    nonce,
    data
  )

  const signedTransaction = transactions.signTransaction(
    unsignedTransaction,
    Buffer.from(LSK_CHAIN_ID, 'hex'),
    keyPair.secretKey,
    TRANSACTION_PARAMS_SCHEMA
  ) as unknown as Transaction

  const id = bytesToHex(signedTransaction.id)

  return { hex: encodeTransaction(signedTransaction), id }
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
  const amountString = transactions.convertLSKToBeddows((+amount).toFixed(LSK_DECIMALS))
  const feeString = transactions.convertLSKToBeddows((+fee).toFixed(LSK_DECIMALS))
  const nonceString = nonce.toString()

  // Adjust the values of the unsigned transaction manually
  const unsignedTransaction = {
    module: 'token',
    command: 'transfer',
    fee: BigInt(feeString),
    nonce: BigInt(nonceString),
    senderPublicKey: Buffer.from(senderPublicKey, 'hex'),
    params: Buffer.alloc(0) as unknown, // @todo fix type
    signatures: []
  }

  validator.validator.validate(TRANSACTION_SCHEMA, unsignedTransaction)

  // Create the asset for the Token Transfer transaction
  const transferParams = {
    tokenID: Buffer.from(LSK_TOKEN_ID, 'hex'),
    amount: BigInt(amountString),
    recipientAddress: cryptography.address.getAddressFromLisk32Address(recipientAddress),
    data
  }

  // Add the transaction params to the transaction object
  unsignedTransaction.params = transferParams

  // Only `transaction.params` will be validated
  transactions.validateTransaction(unsignedTransaction, TRANSACTION_PARAMS_SCHEMA)

  return unsignedTransaction
}

/**
 * Encode transaction for later broadcasting to a node.
 */
export function encodeTransaction(transaction: DecodedTransaction | Transaction) {
  let encodedParams
  if (!Buffer.isBuffer(transaction.params)) {
    encodedParams = codec.encode(TRANSACTION_PARAMS_SCHEMA, transaction.params)
  } else {
    encodedParams = transaction.params
  }

  const encodedTransaction = codec.encode(TRANSACTION_SCHEMA, {
    ...transaction,
    params: encodedParams
  })

  return encodedTransaction.toString('hex')
}

type EstimateFeeParams = {
  /**
   * LSK amount
   */
  amount?: string | number
  /**
   * Sender's `publicKey` and `privateKey`
   */
  keyPair?: { publicKey: string; secretKey: string }
  /**
   * Recipient address in Lisk32 format
   */
  recipientAddress?: string
  /**
   * Transaction data field
   */
  data?: string
  isNewAccount?: boolean
}

/**
 * Estimate transaction fee by LSK amount.
 *
 * @param params Transaction params
 */
export function estimateFee(params?: EstimateFeeParams) {
  const {
    amount = '1',
    keyPair = LSK_DEMO_ACCOUNT.keyPair,
    recipientAddress = LSK_DEMO_ACCOUNT.address,
    data = '',
    isNewAccount
  } = params || {}

  const unsignedTransaction = {
    module: 'token',
    command: 'transfer',
    fee: BigInt(0),
    nonce: BigInt(0),
    senderPublicKey: Buffer.from(keyPair.publicKey, 'hex'),
    params: {
      tokenID: Buffer.from(LSK_TOKEN_ID, 'hex'),
      amount: BigInt(convertLSKToBeddows(amount.toString())),
      recipientAddress: cryptography.address.getAddressFromLisk32Address(recipientAddress),
      data
    },
    signatures: []
  }

  const signedTransaction = transactions.signTransaction(
    unsignedTransaction,
    Buffer.from(LSK_CHAIN_ID, 'hex'),
    Buffer.from(keyPair.secretKey, 'hex'),
    TRANSACTION_PARAMS_SCHEMA
  )

  const minFee = computeMinFee(signedTransaction, TRANSACTION_PARAMS_SCHEMA)
  const fee = minFee < LSK_MIN_REQUIRED_FEE ? LSK_MIN_REQUIRED_FEE : minFee
  const commandFee = isNewAccount ? LSK_COMMAND_FEE : BigInt(0)

  const totalFee = fee + commandFee

  return convertBeddowsToLSK(totalFee.toString())
}
