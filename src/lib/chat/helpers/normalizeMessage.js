import { getRealTimestamp } from './utils/getRealTimestamp'
import { isNumeric } from '@/lib/numericHelpers'
import { TransactionStatus as TS } from '@/lib/constants'
import { KnownCryptos, UnsupportedCryptos } from './constants'

/**
 * Transform message for better integration into Vue components.
 * @param {Object} abstract Message object returned by the server.
 * @returns {Message} See `components/AChat/types.ts`
 */
export function normalizeMessage(abstract) {
  const transaction = {}

  // common properties for all transaction types
  transaction.id = abstract.id
  transaction.senderId = abstract.senderId
  transaction.recipientId = abstract.recipientId
  transaction.admTimestamp = abstract.timestamp
  transaction.timestamp = getRealTimestamp(abstract.timestamp)
  transaction.confirmations = abstract.confirmations
  transaction.status =
    abstract.height || abstract.confirmations > 0
      ? TS.CONFIRMED
      : abstract.status
      ? abstract.status
      : TS.REGISTERED
  transaction.i18n = !!abstract.i18n
  transaction.amount = abstract.amount ? abstract.amount : 0
  transaction.message = ''
  transaction.height = abstract.height
  transaction.asset = {}

  if (
    abstract.message &&
    abstract.message.reactto_id &&
    typeof abstract.message.react_message === 'string'
  ) {
    transaction.asset = abstract.message
    transaction.hash = abstract.id
    transaction.type = 'reaction'
  } else if (abstract.message && abstract.message.replyto_id && abstract.message.reply_message) {
    // AIP-16: Reply message
    if (typeof abstract.message.reply_message === 'string') {
      // reply with a message
      transaction.asset = abstract.message
      transaction.message = abstract.message.reply_message || ''
      transaction.hash = abstract.id

      if (abstract.amount > 0) {
        transaction.type = 'ADM'
      } else {
        transaction.type = 'message'
      }
    } else {
      // reply with a crypto transfer
      transaction.asset = abstract.message
      transaction.message = abstract.message.reply_message.comments || ''
      transaction.amount = isNumeric(abstract.message.reply_message.amount)
        ? +abstract.message.reply_message.amount
        : 0
      transaction.status = TS.PENDING
      transaction.hash = abstract.message.reply_message.hash || ''

      const cryptoType = abstract.message.reply_message.type.toLowerCase()
      const knownCrypto = KnownCryptos[cryptoType]
      const notSupportedYetCrypto = UnsupportedCryptos[cryptoType]
      if (knownCrypto) {
        transaction.type = knownCrypto
      } else {
        transaction.type = notSupportedYetCrypto || 'UNKNOWN_CRYPTO'
        transaction.status = TS.UNKNOWN
      }
    }

    transaction.isReply = true
  } else if (abstract.message && abstract.message.type) {
    // cryptos
    transaction.asset = abstract.message
    transaction.message = abstract.message.comments || ''
    transaction.amount = isNumeric(abstract.message.amount) ? +abstract.message.amount : 0
    transaction.status = TS.PENDING
    transaction.hash = abstract.message.hash || ''

    const cryptoType = abstract.message.type.toLowerCase()
    const knownCrypto = KnownCryptos[cryptoType]
    const notSupportedYetCrypto = UnsupportedCryptos[cryptoType]
    if (knownCrypto) {
      transaction.type = knownCrypto
    } else {
      transaction.type = notSupportedYetCrypto || 'UNKNOWN_CRYPTO'
      transaction.status = TS.UNKNOWN
    }
  } else {
    // ADM transaction or Message
    transaction.message = abstract.message || ''
    transaction.hash = abstract.id // adm transaction id (hash)

    abstract.amount > 0 ? (transaction.type = 'ADM') : (transaction.type = 'message')
  }

  return transaction
}
