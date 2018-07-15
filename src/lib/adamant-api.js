import sa from 'superagent'

import getEndpointUrl from './getEndpointUrl'
import { Cryptos, Transactions, Delegates } from './constants'
import utils from './adamant'

/** @type {{privateKey: Buffer, publicKey: Buffer}} */
let myKeypair = { }
let myAddress = null

/** Delta between local time and server time (ADM timestamp) */
let serverTimeDelta = 0

const publicKeysCache = { }

function toAbsolute (url = '') {
  return getEndpointUrl(Cryptos.ADM) + url
}

function parseResponse (response) {
  const body = response.body
  if (body && isFinite(body.nodeTimestamp)) {
    serverTimeDelta = utils.epochTime() - body.nodeTimestamp
  }
  return body
}

function get (url, query) {
  return sa.get(toAbsolute(url))
    .query(query)
    .then(parseResponse)
}

function post (url, payload) {
  return sa.post(toAbsolute(url))
    .send(payload)
    .then(parseResponse)
}

/**
 * Creates a new transaction with the common fields pre-filled
 * @param {number} type transaction type
 * @returns {{type: number, senderId: string, senderPublicKey: string, timestamp: number}}
 */
function newTransaction (type) {
  return {
    type,
    amount: 0,
    senderId: myAddress,
    senderPublicKey: myKeypair.publicKey.toString('hex'),
    timestamp: utils.epochTime() - serverTimeDelta
  }
}

export function unlock (passphrase) {
  const hash = utils.createPassPhraseHash(passphrase)
  myKeypair = utils.makeKeypair(hash)
  myAddress = utils.getAddressFromPublicKey(myKeypair.publicKey)
}

/**
 * Returns `true` if API client is unlocked and ready to process requests. *
 * @returns {Boolean}
 */
export function isReady () {
  return Boolean(myAddress && myKeypair)
}

/**
 * Retrieves user public key by his address
 * @param {string} address ADM address
 * @returns {Promise<string>}
 */
export function getPublicKey (address = '') {
  if (publicKeysCache[address]) {
    return Promise.resolve(publicKeysCache[address])
  }

  return get('/api/accounts/getPublicKey', { address })
    .then(response => {
      const key = response.publicKey
      publicKeysCache[address] = key
      return key
    })
}

/**
 * @typedef {Object} MsgParams
 * @property {string} to target address
 * @property {string|object} message message to send (object value will be JSON-serialized)
 * @property {number} type 1 for a regular message, 2 for a special one
 * @property {number} amount ADMs to send with this message
 */

/**
 * Sends message with the specified payload
 * @param {MsgParams} params
 * @returns {Promise<{success: boolean, transactionId: string}>}
 */
export function sendMessage (params) {
  return getPublicKey(params.to)
    .then(publicKey => {
      const text = typeof params.message === 'string'
        ? params.message
        : JSON.stringify(params.message)
      const encoded = utils.encodeMessage(text, publicKey, myKeypair.privateKey)
      const chat = {
        message: encoded.message,
        own_message: encoded.nonce,
        type: params.type || 1
      }

      const transaction = newTransaction(Transactions.CHAT_MESSAGE)
      transaction.amount = params.amount ? utils.prepareAmount(params.amount) : 0
      transaction.asset = { chat }
      transaction.recipientId = params.to
      transaction.signature = utils.transactionSign(transaction, myKeypair)

      return post('/api/chats/process', { transaction })
    })
}

/**
 * Sends special message with the specified payload
 * @param {string} to recipient address
 * @param {object} payload message payload
 */
export function sendSpecialMessage (to, payload) {
  return sendMessage({ to, message: payload, type: 2 })
}

/**
 * Stores the supplied value into the Adamant KVS under the specified key.
 * @param {string} key key for the stored value
 * @param {any} value value to store
 * @returns {Promise<{success: boolean}>}
 */
export function storeValue (key, value, encode = false) {
  if (encode) {
    const encoded = utils.encodeValue(value, myKeypair.privateKey)
    value = JSON.stringify(encoded)
  }

  const transaction = newTransaction(Transactions.STATE)
  transaction.asset = { state: { key, value, type: 0 } }
  transaction.signature = utils.transactionSign(transaction, myKeypair)
  return post('/api/states/store', { transaction })
}

function tryDecodeStoredValue (value) {
  let json = null
  try {
    json = JSON.parse(value)
  } catch (e) {
    // Not a JSON => not an encoded value
    return value
  }

  if (json.nonce) {
    try {
      return utils.decodeValue(json.message, myKeypair.privateKey, json.nonce)
    } catch (e) {
      console.warn('Failed to parse encoded value', e)
      throw e
    }
  }

  return json
}

/**
 * Retrieves the stored value from the Adamant KVS
 * @param {string} key key in the KVS
 * @param {string=} ownerAddress address of the value owner
 * @returns {Promise<any>}
 */
export function getStored (key, ownerAddress) {
  if (!ownerAddress) {
    ownerAddress = myAddress
  }

  const params = {
    senderId: ownerAddress,
    key,
    orderBy: 'timestamp:desc',
    limit: 1
  }

  return get('/api/states/get', params).then(response => {
    let value = null

    if (response.success && Array.isArray(response.transactions)) {
      const tx = response.transactions[0]
      value = tx && tx.asset && tx.asset.state && tx.asset.state.value
    }

    return tryDecodeStoredValue(value)
  })
}

/**
 * Sends the specified amount of ADM to the specified ADM address
 * @param {string} to receiver address
 * @param {number} amount amount of ADM to send
 * @returns {Promise<{success: boolean, transactionId: string}>}
 */
export function sendTokens (to, amount) {
  const transaction = newTransaction(Transactions.SEND)
  transaction.amount = utils.prepareAmount(amount)
  transaction.recipientId = to
  transaction.signature = utils.transactionSign(transaction, myKeypair)

  return post('/api/transactions/process', { transaction })
}

export function getDelegates (limit, offset) {
  return get('/api/delegates', { limit, offset })
}

export function getDelegatesWithVotes (address) {
  return get('/api/accounts/delegates', { address })
}

export function getDelegatesCount () {
  return get('/api/delegates/count')
}

export function checkUnconfirmedTransactions () {
  return get('/api/transactions/unconfirmed')
}

export function voteForDelegates (votes) {
  let transaction = newTransaction(Transactions.VOTE)
  transaction = Object.assign({
    asset: { votes: votes },
    recipientId: myAddress,
    amount: 0
  }, transaction)
  transaction.signature = utils.transactionSign(transaction, myKeypair)
  return post('/api/accounts/delegates', transaction)
}

export function getNextForgers () {
  return get('/api/delegates/getNextForgers', { limit: Delegates.ACTIVE_DELEGATES })
}

export function getBlocks () {
  return get('/api/blocks?orderBy=height:desc&limit=100')
}

export function getForgedByAccount (accountPublicKey) {
  return get('/api/delegates/forging/getForgedByAccount', { generatorPublicKey: accountPublicKey })
}

/**
 * Retrieves ADM transactions.
 * @param {{type: number, from: number, to: number}} options specifies height range
 * @returns {Promise<{success: boolean, transactions: Array}>}
 */
export function getTransactions (options = { }) {
  const query = {
    inId: myAddress,
    'and:type': options.type || Transactions.SEND,
    orderBy: 'timestamp:desc'
  }

  if (options.to) {
    query['and:toHeight'] = options.to
  }

  if (options.from) {
    query['and:fromHeight'] = options.from
  }

  return get('/api/transactions', query)
}

/**
 * Returns transaction with the specified ID.
 * @param {string} id transaction ID
 * @returns {Promise<{id: string, height: number, amount: number}>}
 */
export function getTransaction (id) {
  const query = { id }
  return get('/api/transactions/get', query)
    .then(response => {
      if (response.success) return response
      return get('/api/transactions/unconfirmed/get', query)
    })
    .then(response => response.transaction || null)
}
