import { TransactionStatus as TS } from '@/lib/constants'

/**
 * Creates a message object with uniq ID.
 * @param {number} id
 * @param {string} recipientId
 * @param {string} senderId
 * @param {string} message
 * @param {string} status
 * @param {string} replyToId Optional
 */
export function createMessage({ id, recipientId, senderId, message, status = TS.PENDING, replyToId }) {
  const transaction = {
    id,
    recipientId,
    senderId,
    message,
    status,
    timestamp: Date.now(),
    type: 'message',
    isReply: !!replyToId
  }

  if (replyToId) {
    transaction.asset = {
      replyto_id: replyToId
    }
  }

  return transaction
}
