/* eslint-disable no-redeclare */
'use strict'

var sodium = require('sodium-browserify-tweetnacl')
var crypto = require('crypto')
var Mnemonic = require('bitcore-mnemonic')
const nacl = require('tweetnacl/nacl-fast')
const ed2curve = require('ed2curve')
const utf8 = require('@stablelib/utf8')
var bignum = require('./bignumber.js')
var ByteBuffer = require('bytebuffer')
const constants = require('./constants.js')
const { hexToBytes, bytesToHex } = require('./hex')

/**
 * Crypto functions that implements sodium.
 * @memberof module:helpers
 * @requires sodium
 * @namespace
 */
var adamant = {}

/**
 * Converts provided `time` to Adamant's epoch timestamp
 * @param {number=} time timestamp to convert
 * @returns {number}
 */
adamant.epochTime = function (time) {
  if (!time) {
    time = Date.now()
  }

  return Math.floor((time - constants.EPOCH) / 1000)
}

/**
 * Parses URI, return false on fails or object with fields if valid
 * @param uri
 * @returns {*}
 */
adamant.parseURI = function (uri) {
  var r = /^adm:(U[0-9]{17,22})(?:\?(.*))?$/
  var match = r.exec(uri)
  if (!match) {
    return false
  }
  var parsed = { url: uri }
  if (match[2]) {
    var queries = match[2].split('&')
    for (var i = 0; i < queries.length; i++) {
      var query = queries[i].split('=')
      if (query.length === 2) {
        parsed[query[0]] = decodeURIComponent(query[1].replace(/\+/g, '%20'))
      }
    }
  }
  parsed.address = match[1]
  return parsed
}

/**
 * Creates a hash based on a passphrase.
 * @param {string} passPhrase
 * @return {string} hash
 */
adamant.createPassPhraseHash = function (passPhrase) {
  var secretMnemonic = new Mnemonic(passPhrase, Mnemonic.Words.ENGLISH)
  return crypto.createHash('sha256').update(secretMnemonic.toSeed().toString('hex'), 'hex').digest()
}

/**
 * Creates a keypar based on a hash.
 * @implements {sodium}
 * @param {hash} hash
 * @return {Object} publicKey, privateKey
 */
adamant.makeKeypair = function (hash) {
  var keypair = sodium.crypto_sign_seed_keypair(hash)

  return {
    publicKey: keypair.publicKey,
    privateKey: keypair.secretKey
  }
}

/**
 * Calculates ADM address based on the public key specified
 * @param {any} publicKey public key to derive ADM address from
 * @returns {string}
 */
adamant.getAddressFromPublicKey = function (publicKey) {
  const publicKeyHash = crypto.createHash('sha256').update(publicKey, 'hex').digest()
  const temp = Buffer.alloc(8)

  for (var i = 0; i < 8; i++) {
    temp[i] = publicKeyHash[7 - i]
  }

  return 'U' + bignum.fromBuffer(temp).toString()
}

/**
 * Creates hash based on transaction bytes.
 * @implements {getBytes}
 * @implements {crypto.createHash}
 * @param {transaction} trs
 * @return {hash} sha256 crypto hash
 */
adamant.getHash = function (trs) {
  return crypto.createHash('sha256').update(this.getBytes(trs)).digest()
}

/**
 * Calls `getBytes` based on trs type (see privateTypes)
 * @see privateTypes
 * @implements {ByteBuffer}
 * @param {transaction} trs
 * @param {boolean} skipSignature
 * @param {boolean} skipSecondSignature
 * @return {!Array} Contents as an ArrayBuffer.
 * @throws {error} If buffer fails.
 */

adamant.getBytes = function (transaction) {
  var skipSignature = false
  var skipSecondSignature = true
  var assetSize = 0
  var assetBytes = null

  switch (transaction.type) {
    case constants.Transactions.SEND:
      break
    case constants.Transactions.CHAT_MESSAGE:
      assetBytes = this.chatGetBytes(transaction)
      assetSize = assetBytes.length
      break
    case constants.Transactions.STATE:
      assetBytes = this.stateGetBytes(transaction)
      assetSize = assetBytes.length
      break
    default:
      alert('Not supported yet')
  }

  var bb = new ByteBuffer(1 + 4 + 32 + 8 + 8 + 64 + 64 + assetSize, true)

  bb.writeByte(transaction.type)
  bb.writeInt(transaction.timestamp)

  var senderPublicKeyBuffer = Buffer.from(transaction.senderPublicKey, 'hex')
  for (var i = 0; i < senderPublicKeyBuffer.length; i++) {
    bb.writeByte(senderPublicKeyBuffer[i])
  }

  if (transaction.requesterPublicKey) {
    var requesterPublicKey = Buffer.from(transaction.requesterPublicKey, 'hex')

    for (var i = 0; i < requesterPublicKey.length; i++) {
      bb.writeByte(requesterPublicKey[i])
    }
  }

  if (transaction.recipientId) {
    var recipient = transaction.recipientId.slice(1)
    // eslint-disable-next-line new-cap
    recipient = new bignum(recipient).toBuffer({size: 8})

    for (i = 0; i < 8; i++) {
      bb.writeByte(recipient[i] || 0)
    }
  } else {
    for (i = 0; i < 8; i++) {
      bb.writeByte(0)
    }
  }

  bb.writeLong(transaction.amount)

  if (assetSize > 0) {
    for (var i = 0; i < assetSize; i++) {
      bb.writeByte(assetBytes[i])
    }
  }

  if (!skipSignature && transaction.signature) {
    var signatureBuffer = Buffer.from(transaction.signature, 'hex')
    for (var i = 0; i < signatureBuffer.length; i++) {
      bb.writeByte(signatureBuffer[i])
    }
  }

  if (!skipSecondSignature && transaction.signSignature) {
    var signSignatureBuffer = Buffer.from(transaction.signSignature, 'hex')
    for (var i = 0; i < signSignatureBuffer.length; i++) {
      bb.writeByte(signSignatureBuffer[i])
    }
  }

  bb.flip()
  var arrayBuffer = new Uint8Array(bb.toArrayBuffer())
  var buffer = []

  for (var i = 0; i < arrayBuffer.length; i++) {
    buffer[i] = arrayBuffer[i]
  }

  return Buffer.from(buffer)
}

adamant.transactionSign = function (trs, keypair) {
  var hash = this.getHash(trs)
  return this.sign(hash, keypair).toString('hex')
}
adamant.chatGetBytes = function (trs) {
  var buf

  try {
    buf = Buffer.from([])
    var messageBuf = Buffer.from(trs.asset.chat.message, 'hex')
    buf = Buffer.concat([buf, messageBuf])

    if (trs.asset.chat.own_message) {
      var ownMessageBuf = Buffer.from(trs.asset.chat.own_message, 'hex')
      buf = Buffer.concat([buf, ownMessageBuf])
    }
    var bb = new ByteBuffer(4 + 4, true)
    bb.writeInt(trs.asset.chat.type)
    bb.flip()
    buf = Buffer.concat([buf, Buffer.from(bb.toBuffer())])
  } catch (e) {
    throw e
  }

  return buf
}

adamant.stateGetBytes = function (trs) {
  if (!trs.asset.state.value) {
    return null
  }
  var buf

  try {
    buf = Buffer.from([])
    var stateBuf = Buffer.from(trs.asset.state.value)
    buf = Buffer.concat([buf, stateBuf])

    if (trs.asset.state.key) {
      var keyBuf = Buffer.from(trs.asset.state.key)
      buf = Buffer.concat([buf, keyBuf])
    }

    var bb = new ByteBuffer(4 + 4, true)
    bb.writeInt(trs.asset.state.type)
    bb.flip()

    buf = Buffer.concat([buf, Buffer.from(bb.toBuffer())])
  } catch (e) {
    throw e
  }

  return buf
}

/**
 * Creates a signature based on a hash and a keypair.
 * @implements {sodium}
 * @param {hash} hash
 * @param {keypair} keypair
 * @return {signature} signature
 */
adamant.sign = function (hash, keypair) {
  return sodium.crypto_sign_detached(hash, Buffer.from(keypair.privateKey, 'hex'))
}

/**
 * Verifies a signature based on a hash and a publicKey.
 * @implements {sodium}
 * @param {hash} hash
 * @param {keypair} keypair
 * @return {Boolean} true id verified
 */
adamant.verify = function (hash, signatureBuffer, publicKeyBuffer) {
  return sodium.crypto_sign_verify_detached(signatureBuffer, hash, publicKeyBuffer)
}

/**
 * Encodes a text message for sending to ADM
 * @param {string} msg message to encode
 * @param {*} recipientPublicKey recipient's public key
 * @param {*} privateKey our private key
 * @returns {{message: string, own_message: string}}
 */
adamant.encodeMessage = function (msg, recipientPublicKey, privateKey) {
  const nonce = Buffer.allocUnsafe(24)
  sodium.randombytes(nonce)

  const plainText = Buffer.from(msg)
  const DHPublicKey = ed2curve.convertPublicKey(hexToBytes(recipientPublicKey))
  const DHSecretKey = ed2curve.convertSecretKey(privateKey)

  const encrypted = nacl.box(plainText, nonce, DHPublicKey, DHSecretKey)

  return {
    message: bytesToHex(encrypted),
    own_message: bytesToHex(nonce)
  }
}

/**
 * Decodes the incoming message
 * @param {any} msg encoded message
 * @param {string} senderPublicKey sender public key
 * @param {string} privateKey our private key
 * @param {any} nonce nonce
 * @returns {string}
 */
adamant.decodeMessage = function (msg, senderPublicKey, privateKey, nonce) {
  const DHPublicKey = ed2curve.convertPublicKey(senderPublicKey)
  const DHSecretKey = ed2curve.convertSecretKey(privateKey)
  const decrypted = nacl.box.open(msg, nonce, DHPublicKey, DHSecretKey)

  return decrypted ? utf8.decode(decrypted) : ''
}

/**
 * Converts ADM amount to its internal representation
 * @param {number|string} admAmount amount to convert
 * @returns {number}
 */
adamant.prepareAmount = function (admAmount) {
  return Math.round(Number(admAmount) * 100000000)
}

module.exports = adamant
