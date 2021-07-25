import { isStringEqualCI } from '@/lib/textHelpers'

const AllowAmountErrorPercent = 0.3
const AllowTimestampDeltaSec = 1800 // 30 min

const TransactionInconsistentReason = {
  UNKNOWN: 'unknown',
  NO_RECIPIENT_CRYPTO_ADDRESS: 'no_recipient_crypto_address',
  NO_SENDER_CRYPTO_ADDRESS: 'no_sender_crypto_address',
  NO_RECIPIENT_ADM_ID: 'no_recipient_adm_id',
  NO_SENDER_ADM_ID: 'no_sender_adm_id',
  WRONG_TX_HASH: 'wrong_tx_hash',
  WRONG_AMOUNT: 'wrong_amount',
  WRONG_TIMESTAMP: 'wrong_timestamp',
  SENDER_CRYPTO_ADDRESS_MISMATCH: 'sender_crypto_address_mismatch',
  RECIPIENT_CRYPTO_ADDRESS_MISMATCH: 'recipient_crypto_address_mismatch'
}

export function verifyTransactionDetails (transaction, admSpecialMessage, { recipientCryptoAddress, senderCryptoAddress }) {
  try {
    const coin = admSpecialMessage.type

    if (!recipientCryptoAddress) {
      return {
        isTxConsistent: false,
        txCoin: coin,
        txInconsistentReason: TransactionInconsistentReason.NO_RECIPIENT_CRYPTO_ADDRESS
      }
    }
    if (!senderCryptoAddress) {
      return {
        isTxConsistent: false,
        txCoin: coin,
        txInconsistentReason: TransactionInconsistentReason.NO_SENDER_CRYPTO_ADDRESS
      }
    }
    if (!transaction.recipientId) {
      return {
        isTxConsistent: false,
        txCoin: coin,
        txInconsistentReason: TransactionInconsistentReason.NO_RECIPIENT_ADM_ID
      }
    }
    if (!transaction.senderId) {
      return {
        isTxConsistent: false,
        txCoin: coin,
        txInconsistentReason: TransactionInconsistentReason.NO_SENDER_ADM_ID
      }
    }

    if (transaction.hash !== admSpecialMessage.hash) {
      return {
        isTxConsistent: false,
        txCoin: coin,
        txInconsistentReason: TransactionInconsistentReason.WRONG_TX_HASH
      }
    }

    if (!verifyAmount(+transaction.amount, +admSpecialMessage.amount)) {
      return {
        isTxConsistent: false,
        txCoin: coin,
        txInconsistentReason: TransactionInconsistentReason.WRONG_AMOUNT
      }
    }

    if (!verifyTimestamp(transaction.timestamp, admSpecialMessage.timestamp)) {
      return {
        isTxConsistent: false,
        txCoin: coin,
        txInconsistentReason: TransactionInconsistentReason.WRONG_TIMESTAMP
      }
    }

    if (!isStringEqualCI(transaction.senderId, senderCryptoAddress)) {
      return {
        isTxConsistent: false,
        txCoin: coin,
        txInconsistentReason: TransactionInconsistentReason.SENDER_CRYPTO_ADDRESS_MISMATCH
      }
    }

    if (!isStringEqualCI(transaction.recipientId, recipientCryptoAddress)) {
      return {
        isTxConsistent: false,
        txCoin: coin,
        txInconsistentReason: TransactionInconsistentReason.RECIPIENT_CRYPTO_ADDRESS_MISMATCH
      }
    }
  } catch (e) {
    return {
      isTxConsistent: false,
      txInconsistentReason: TransactionInconsistentReason.UNKNOWN
    }
  }

  return {
    isTxConsistent: true
  }
}

/**
 * Delta should be <= AllowAmountErrorPercent
 */
function verifyAmount (transactionAmount, specialMessageAmount) {
  const margin = transactionAmount / (100 / AllowAmountErrorPercent)
  const delta = Math.abs(transactionAmount - specialMessageAmount)
  return delta <= margin
}

function verifyTimestamp (transactionTimestamp, specialMessageTimestamp) {
  const delta = Math.abs(transactionTimestamp - specialMessageTimestamp) / 1000
  return delta < AllowTimestampDeltaSec
}
