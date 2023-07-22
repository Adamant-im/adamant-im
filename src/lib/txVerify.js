import { isStringEqualCI } from '@/lib/textHelpers'
import { i18n } from '@/i18n'
import { CryptosInfo, isErc20 } from '@/lib/constants'

const AllowAmountErrorPercent = 0.3

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

export function verifyTransactionDetails(
  transaction,
  admSpecialMessage,
  { recipientCryptoAddress, senderCryptoAddress }
) {
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

    if (!isStringEqualCI(transaction.hash, admSpecialMessage.hash)) {
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

    // Don't check timestamp if there is no timestamp yet. F. e. transaction.instantsend = true for Dash
    if (
      transaction.timestamp &&
      !verifyTimestamp(coin, transaction.timestamp, admSpecialMessage.timestamp)
    ) {
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

export function formatSendTxError(error) {
  const formattedError = {}
  formattedError.details = {}
  formattedError.details.status = error.response ? error.response.status : undefined
  formattedError.details.statusText = error.response ? error.response.statusText : undefined
  formattedError.details.error = error.toString()
  formattedError.details.response = error.response

  formattedError.errorMessage = `${i18n.global.t('error')}: `
  if (error.response && error.response.data) {
    const errorData = error.response.data
    if (errorData.error) {
      // Dash-like
      const codeString = errorData.error.code ? `[${errorData.error.code}]` : ''
      const messageString = errorData.error.message ? ` ${errorData.error.message}` : ''
      formattedError.errorCode = errorData.error.code
      formattedError.errorMessage += ` ${codeString}${messageString}`
    } else if (errorData.errors && errorData.errors[0]) {
      // Lisk-like
      formattedError.errorMessage += errorData.errors[0].message
    } else {
      // Unknown response format
      formattedError.errorMessage +=
        typeof errorData === 'object' ? ` ${JSON.stringify(errorData, 0, 2)}` : errorData.toString()
    }
  } else {
    if (error.message) {
      // Doge-like
      formattedError.errorMessage += error.message
    } else {
      // Unknown
      formattedError.errorMessage += error.toString()
    }
  }
  return formattedError
}

/**
 * Delta should be <= AllowAmountErrorPercent
 */
function verifyAmount(transactionAmount, specialMessageAmount) {
  const margin = transactionAmount / (100 / AllowAmountErrorPercent)
  const delta = Math.abs(transactionAmount - specialMessageAmount)
  return delta <= margin
}

function verifyTimestamp(coin, transactionTimestamp, specialMessageTimestamp) {
  const delta = Math.abs(transactionTimestamp - specialMessageTimestamp) / 1000

  const mainCoin = CryptosInfo[coin].mainCoin || coin
  const { txConsistencyMaxTime } = CryptosInfo[mainCoin]

  if (txConsistencyMaxTime) {
    return delta < txConsistencyMaxTime
  }

  return true
}
