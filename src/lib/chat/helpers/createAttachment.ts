import utils from '@/lib/adamant'
import { TransactionStatus as TS, TransactionStatusType } from '@/lib/constants'
import { attachmentAsset } from '@/lib/adamant-api/asset'

type Params = {
  recipientId: string
  senderId: string
  files: File[]
  message?: string
  replyToId?: string
  status?: TransactionStatusType
}

/**
 * Creates a message object with uniq ID.
 */
export function createAttachment({
  recipientId,
  senderId,
  files,
  message,
  replyToId,
  status = TS.PENDING
}: Params) {
  const transaction = {
    id: utils.epochTime(),
    recipientId,
    senderId,
    message: message || '',
    status,
    timestamp: Date.now(),
    type: 'attachment',
    asset: replyToId
      ? { replyto_id: replyToId, reply_message: attachmentAsset(files) }
      : attachmentAsset(files),
    isReply: !!replyToId
  }

  return transaction
}
