import Queue from 'promise-queue'
import * as admApi from '@/lib/adamant-api'

const maxConcurent = 1
const maxQueue = Infinity

const queue = new Queue(maxConcurent, maxQueue)

/**
 * Add a message to the queue.
 * @param {string | object} message
 * @param {string} recipientId
 * @param {number} type
 * @returns {Promise}
 */
export function queueMessage(message, recipientId, type) {
  return queue.add(() => {
    return admApi.sendMessage({
      to: recipientId,
      message,
      type
    })
  })
}

/**
 * Add a signed transaction to the queue.
 * @param {object} signedTransaction
 * @returns {Promise}
 */
export function queueSignedMessage(signedTransaction) {
  return queue.add(() => admApi.sendSignedTransaction(signedTransaction))
}
