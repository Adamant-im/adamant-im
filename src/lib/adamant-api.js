import popsicle from 'popsicle'
import getEndpointUrl from './getEndpointUrl'
import { Cryptos, Transactions } from './constants'
import utils from './adamant'

const endpoint = getEndpointUrl(Cryptos.ADM)

/** @type {{privateKey: Buffer, publicKey: Buffer}} */
let myKeypair = { }

const publicKeysCache = { }

function toAbsolute (url = '') {
  return endpoint + url
}

function get (url, query) {
  return popsicle({
    url: toAbsolute(url),
    body: query,
    method: 'get'
  })
}

function post (url, payload) {
  return popsicle({
    url: toAbsolute(url),
    body: payload,
    method: 'post'
  })
}

export function unlock (passphrase) {
  const hash = utils.createPassPhraseHash(passphrase)
  myKeypair = utils.makeKeypair(hash)
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
      const key = response.body.publicKey
      publicKeysCache[address] = key
      return key
    })
}

/**
 * Sends message with the specified payload
 * @param {string} to recipient address
 * @param {string} text message text
 * @param {number=1} type 1 for a regular message, 2 for a special one
 */
export function sendMessage (to, text, type = 1) {
  return getPublicKey(to)
    .then(publicKey => {
      const message = utils.encodeMessage(text, publicKey, myKeypair.privateKey)

      const transaction = {
        type: Transactions.CHAT_MESSAGE,
        asset: {
          chat: { ...message, type }
        },
        recipientId: to,
        senderPublicKey: myKeypair.publicKey,
        timestamp: utils.epochTime()
      }
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
  return sendMessage(to, JSON.stringify(payload), 2)
}
