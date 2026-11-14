import type { DecodedChatMessageTransaction } from '@/lib/adamant-api'
import type { NormalizedChatMessageTransaction } from '@/lib/chat/helpers/normalizeMessage'
import { CoinTransaction } from '@/lib/nodes/types/transaction'
import { isStringEqualCI } from '@/lib/textHelpers'
import { Cryptos, CryptosInfo, CryptoSymbol } from '@/lib/constants'
import { BigNumber } from '@/lib/bignumber'
import { isNumeric } from '@/lib/numericHelpers'

const AllowAmountErrorPercent = 0.3
const AdmAmountMultiplier = 1e8

export const TransactionInconsistentReason = {
  UNKNOWN: 'unknown',
  NO_RECIPIENT_CRYPTO_ADDRESS: 'no_recipient_crypto_address',
  NO_SENDER_CRYPTO_ADDRESS: 'no_sender_crypto_address',
  WRONG_TX_HASH: 'wrong_tx_hash',
  WRONG_AMOUNT: 'wrong_amount',
  WRONG_TIMESTAMP: 'wrong_timestamp',
  SENDER_CRYPTO_ADDRESS_MISMATCH: 'sender_crypto_address_mismatch',
  RECIPIENT_CRYPTO_ADDRESS_MISMATCH: 'recipient_crypto_address_mismatch'
}

export type InconsistentStatus =
  (typeof TransactionInconsistentReason)[keyof typeof TransactionInconsistentReason]

export function getInconsistentStatus(
  transaction: CoinTransaction | DecodedChatMessageTransaction,
  admTransaction: NormalizedChatMessageTransaction,
  {
    senderCryptoAddress,
    recipientCryptoAddress
  }: { senderCryptoAddress?: string; recipientCryptoAddress?: string }
): InconsistentStatus {
  if (admTransaction.type === Cryptos.ADM) {
    if (!isStringEqualCI(String(transaction.id), String(admTransaction.id))) {
      return TransactionInconsistentReason.WRONG_TX_HASH
    }

    if (
      !isNumeric(transaction.amount) ||
      !isNumeric(admTransaction.amount) ||
      !new BigNumber(transaction.amount).times(AdmAmountMultiplier).isEqualTo(admTransaction.amount)
    ) {
      return TransactionInconsistentReason.WRONG_AMOUNT
    }

    if (!isStringEqualCI(transaction.senderId, admTransaction.senderId)) {
      return TransactionInconsistentReason.SENDER_CRYPTO_ADDRESS_MISMATCH
    }

    if (!isStringEqualCI(transaction.recipientId, admTransaction.recipientId)) {
      return TransactionInconsistentReason.RECIPIENT_CRYPTO_ADDRESS_MISMATCH
    }

    return ''
  }

  const coin = admTransaction.type as unknown as CryptoSymbol

  if (!recipientCryptoAddress) {
    return TransactionInconsistentReason.NO_RECIPIENT_CRYPTO_ADDRESS
  }
  if (!senderCryptoAddress) {
    return TransactionInconsistentReason.NO_SENDER_CRYPTO_ADDRESS
  }

  if (!('hash' in transaction) || !isStringEqualCI(transaction.hash, admTransaction.hash)) {
    return TransactionInconsistentReason.WRONG_TX_HASH
  }

  if (!verifyAmount(+transaction.amount, +admTransaction.amount)) {
    return TransactionInconsistentReason.WRONG_AMOUNT
  }

  if (!isStringEqualCI(transaction.senderId, senderCryptoAddress)) {
    return TransactionInconsistentReason.SENDER_CRYPTO_ADDRESS_MISMATCH
  }

  if (!isStringEqualCI(transaction.recipientId, recipientCryptoAddress)) {
    return TransactionInconsistentReason.RECIPIENT_CRYPTO_ADDRESS_MISMATCH
  }

  // Don't check timestamp if there is no timestamp yet. F. e. transaction.instantsend = true for Dash
  if (
    transaction.timestamp &&
    !verifyTimestamp(coin, transaction.timestamp, admTransaction.timestamp)
  ) {
    return TransactionInconsistentReason.WRONG_TIMESTAMP
  }

  return ''
}

/**
 * Delta should be <= AllowAmountErrorPercent
 */
function verifyAmount(transactionAmount: number, specialMessageAmount: number) {
  const margin = transactionAmount / (100 / AllowAmountErrorPercent)
  const delta = Math.abs(transactionAmount - specialMessageAmount)
  return delta <= margin
}

function verifyTimestamp(
  coin: CryptoSymbol,
  transactionTimestamp: number,
  specialMessageTimestamp: number
) {
  const delta = Math.abs(transactionTimestamp - specialMessageTimestamp)

  const mainCoin = (CryptosInfo[coin] as any)?.mainCoin || coin // @todo fix type in adamant-wallets schema
  const { txConsistencyMaxTime } = CryptosInfo[mainCoin as CryptoSymbol]

  if (txConsistencyMaxTime) {
    return delta < txConsistencyMaxTime
  }

  return true
}
