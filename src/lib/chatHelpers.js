import Queue from 'promise-queue'
import utils from '@/lib/adamant'
import * as admApi from '@/lib/adamant-api'

const maxConcurent = 1
const maxQueue = Infinity

const queue = new Queue(maxConcurent, maxQueue)

/**
 * Add a message to the queue.
 * @param {string} message
 * @param {string} recipientId
 * @returns {Promise}
 */
export function queueMessage (message, recipientId) {
  return queue.add(() => {
    return admApi.sendMessage({
      to: recipientId,
      message
    })
  })
}

/**
 * Retrieve the chat messages for the current account.
 * @param {number} startHeight
 * @param {number} startOffset
 * @param {boolean} recursive
 * @returns {Promise<{messages: Message[], lastMessageHeight: number}>} Array of messages
 */
export function getChats (startHeight = 0, startOffset = 0, recursive = true) {
  let allTransactions = []
  let lastMessageHeight = 0

  function loadMessages (height = 0, offset = 0) {
    return admApi.getChats(height, offset, 'asc')
      .then(result => {
        const { transactions } = result
        const length = transactions.length

        // if no more messages
        if (length <= 0) {
          return allTransactions
        }

        allTransactions = [...allTransactions, ...transactions]

        // Save `height` from last message.
        lastMessageHeight = transactions[length - 1].height

        // recursive
        if (recursive) {
          return loadMessages(height, offset + length)
        } else {
          return allTransactions
        }
      })
  }

  return loadMessages(startHeight, startOffset)
    .then(transactions => ({
      messages: transactions,
      lastMessageHeight: lastMessageHeight
    }))
}

/**
 * Create empty chat.
 */
export function createChat () {
  return {
    messages: [],
    numOfNewMessages: 0
  }
}

/**
 * Creates a message object with uniq ID.
 * @param {string} recipientId
 * @param {string} senderId
 * @param {string} message
 * @param {string} status Can be: `sent`, `confirmed`, `rejected`
 */
export function createMessage ({ recipientId, senderId, message, status = 'sent' }) {
  return {
    id: utils.epochTime(), // @todo uuid will be better
    recipientId,
    senderId,
    message,
    status,
    timestamp: utils.epochTime()
  }
}

/**
 * Returns real timestamp by ADM timestamp.
 * @param {number} admTimestamp
 */
export function getRealTimestamp (admTimestamp) {
  const foundationDate = Date.UTC(2017, 8, 2, 17, 0, 0, 0)

  return parseInt(admTimestamp) * 1000 + foundationDate
}

/**
 * Transform message for better integration into Vue components.
 * @param {Object} abstract Message object returned by the server.
 * @returns {Message} See `packages/chat/src/types.ts`
 */
export function transformMessage (abstract) {
  let transaction = {}

  // common properties for all transaction types
  transaction.id = abstract.id
  transaction.senderId = abstract.senderId
  transaction.admTimestamp = abstract.timestamp
  transaction.timestamp = getRealTimestamp(abstract.timestamp)
  transaction.status = abstract.status || 'confirmed'
  transaction.i18n = (abstract.i18n)
  transaction.amount = abstract.amount ? abstract.amount : 0
  transaction.message = ''

  if (abstract.message && abstract.message.type === 'eth_transaction') {
    transaction.type = 'ETH'
    transaction.message = abstract.message.comments || ''
  } else if (abstract.amount > 0) { // ADM transaction
    transaction.type = 'ADM'
    transaction.message = abstract.message
  } else {
    transaction.type = 'message'
    transaction.message = abstract.message
  }

  return transaction
}
