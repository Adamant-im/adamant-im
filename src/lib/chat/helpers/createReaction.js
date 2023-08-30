import utils from '@/lib/adamant'
import { TransactionStatus as TS } from '@/lib/constants'
import { reactionAsset } from '@/lib/adamant-api/asset'

/**
 * Creates a message object with uniq ID.
 * @param {string} recipientId
 * @param {string} senderId
 * @param {string} reactToId
 * @param {string} reactMessage Emoji
 * @param {string} status
 */
export function createReaction({
  recipientId,
  senderId,
  reactToId,
  reactMessage,
  status = TS.PENDING
}) {
  const transaction = {
    id: utils.epochTime(), // @todo uuid will be better
    recipientId,
    senderId,
    message: '',
    status,
    timestamp: Date.now(),
    type: 'reaction',
    isReaction: !!reactToId,
    asset: reactionAsset(reactToId, reactMessage)
  }

  return transaction
}
