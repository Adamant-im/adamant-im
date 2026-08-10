import { MessageType } from '@/lib/constants'

/**
 * Returns whether a raw transaction is allowed to enter a user-visible chat path.
 * AIP-6 signal messages are protocol control messages and must stay hidden in dialogs.
 *
 * @param {object} transaction Raw ADM transaction
 * @returns {boolean}
 */
export function isChatTransactionVisible(transaction) {
  return transaction?.asset?.chat?.type !== MessageType.SIGNAL_MESSAGE
}
