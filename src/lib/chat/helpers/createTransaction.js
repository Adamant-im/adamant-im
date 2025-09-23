import { TransactionStatus as TS, TransactionTypes as TT } from '@/lib/constants'

/**
 * Create a transaction object with uniq ID.
 * @param {number} transactionId
 * @param {string} recipientId
 * @param {string} senderId
 * @param {number} amount
 * @param {string} comment Transaction comment
 * @param {string} type ADM, ETH...
 * @param {string} status
 * @param {string} replyToId optional
 */
export function createTransaction(payload) {
  const {
    transactionId,
    recipientId,
    senderId,
    amount,
    comment,
    hash,
    type = TT.ADM,
    status = TS.PENDING,
    replyToId
  } = payload

  const transaction = {
    id: transactionId,
    recipientId,
    senderId,
    amount,
    hash,
    type,
    status,
    timestamp: Date.now(),
    isReply: !!replyToId
  }

  if (comment) {
    transaction.message = comment
  }

  if (replyToId) {
    transaction.asset = {
      replyto_id: replyToId
    }
  }

  return transaction
}
