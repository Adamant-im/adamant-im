/* eslint-disable no-redeclare */
'use strict'

var sodium = require('sodium-browserify-tweetnacl')
var crypto = require('crypto')
var Mnemonic = require('bitcore-mnemonic')
var bignum = require('./bignumber.js')
var ByteBuffer = require('bytebuffer')

/**
 * Crypto functions that implements sodium.
 * @memberof module:helpers
 * @requires sodium
 * @namespace
 */
var adamant = {}

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
    case 0:
      break
    case 8:
      assetBytes = this.chatGetBytes(transaction)
      assetSize = assetBytes.length
      break
    default:
      alert('Not supported yet')
  }

  var bb = new ByteBuffer(1 + 4 + 32 + 8 + 8 + 64 + 64 + assetSize, true)

  bb.writeByte(transaction.type)
  bb.writeInt(transaction.timestamp)

  var senderPublicKeyBuffer = new Buffer(transaction.senderPublicKey, 'hex')
  for (var i = 0; i < senderPublicKeyBuffer.length; i++) {
    bb.writeByte(senderPublicKeyBuffer[i])
  }

  if (transaction.requesterPublicKey) {
    var requesterPublicKey = new Buffer(transaction.requesterPublicKey, 'hex')

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
    var signatureBuffer = new Buffer(transaction.signature, 'hex')
    for (var i = 0; i < signatureBuffer.length; i++) {
      bb.writeByte(signatureBuffer[i])
    }
  }

  if (!skipSecondSignature && transaction.signSignature) {
    var signSignatureBuffer = new Buffer(transaction.signSignature, 'hex')
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

  return new Buffer(buffer)
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
    console.log(bb)
    bb.writeInt(trs.asset.chat.type)
    bb.flip()
    console.log(bb)
    console.log(bb.toBuffer)
    console.log(buf)
    console.log([buf, Buffer.from(bb.toBuffer())])
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

module.exports = adamant
