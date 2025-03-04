import Queue from 'promise-queue'
import * as admApi from '@/lib/adamant-api'

const maxConcurent = 1
const maxQueue = Infinity

const queue = new Queue(maxConcurent, maxQueue)

/**
 * Add a message to the queue.
 * @param {string | object} message
 * @param {string} recipientId
 * @returns {Promise}
 */
export function queueMessage(message, recipientId, type, id) {
  return queue.add(() => {
    return admApi.sendMessage({
      to: recipientId,
      message,
      type,
      id
    })
  })
}
