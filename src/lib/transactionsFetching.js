import { CryptosInfo, isInstantSendPossible } from './constants'

/** Pending transaction may be not known to blockchain yet */

/** Interval (ms) between attempts to fetch an registered transaction, when InstantSend is possible */
export const INSTANT_SEND_INTERVAL = 4 * 1000
/** Time (ms) to consider InstantSend is yet possible */
export const INSTANT_SEND_TIME = 60 * 1000
/** Will be used if the coin doesn't provide `txFetchInfo` in `adamant-wallets` **/
export const DEFAULT_TX_FETCH_INTERVAL = 10000
export const DEFAULT_TX_FETCH_ATTEMPTS = 5

/**
 * Returns `true` if the transaction with the specified timestamp can be considered as new
 * ~ Timestamp less then 20 * Block time
 * @param {number} timestamp the timestamp to test
 * @param {string} crypto crypto name
 * @returns {boolean}
 */
export const isNew = (timestamp, crypto) => {
  const mainCoin = CryptosInfo[crypto].mainCoin || crypto
  const { txFetchInfo } = CryptosInfo[mainCoin]

  const attempts = txFetchInfo?.newPendingAttempts || DEFAULT_TX_FETCH_ATTEMPTS

  return (
    Date.now() - timestamp < getTxUpdateInterval(crypto) * attempts
  )
}

/**
 * Returns a retry interval (ms) for a pending transaction details re-fetching
 * @param {number} timestamp transaction timestamp
 * @param {string} crypto crypto name
 * @returns {number}
 */
export const getPendingTxRetryTimeout = function (timestamp, crypto) {
  const mainCoin = CryptosInfo[crypto].mainCoin || crypto

  if (isNew(timestamp, crypto)) {
    return getTxUpdateInterval(crypto)
  } else {
    return CryptosInfo[mainCoin].txFetchInfo?.oldPendingInterval || DEFAULT_TX_FETCH_INTERVAL
  }
}

/**
 * Returns a retry interval (ms) for a registered transaction details re-fetching
 * This function is important to get InstantSend txs faster
 * @param {string} timestamp transaction timestamp. Expected Date.now() when it was checked first time
 * @param {string} crypto crypto name
 * @param {number} regularTimeout regular retry interval for a coin
 * @param {boolean} gotInstantSendAlready if tx has InstantSend status already
 * @returns {number}
 */
export const getRegisteredTxRetryTimeout = function (
  timestamp,
  crypto,
  regularTimeout,
  gotInstantSendAlready
) {
  const mainCoin = CryptosInfo[crypto].mainCoin || crypto

  if (!gotInstantSendAlready && isInstantSendPossible(crypto)) {
    return Date.now() - timestamp < INSTANT_SEND_TIME ? INSTANT_SEND_INTERVAL : regularTimeout
  } else {
    return CryptosInfo[mainCoin].txFetchInfo?.registeredInterval || regularTimeout
  }
}

/**
 * Returns a retry count (times) for a pending transaction details re-fetching
 * @param {number} timestamp transaction timestamp
 * @param {string} crypto crypto name
 * @returns {number}
 */
export const getPendingTxRetryCount = function (timestamp, crypto) {
  const mainCoin = CryptosInfo[crypto].mainCoin || crypto
  const { txFetchInfo } = CryptosInfo[mainCoin]

  if (isNew(timestamp, crypto)) {
    return txFetchInfo?.newPendingAttempts || DEFAULT_TX_FETCH_ATTEMPTS
  } else {
    return txFetchInfo?.oldPendingAttempts || DEFAULT_TX_FETCH_ATTEMPTS
  }
}

/**
 * Returns a transaction update interval (ms) to get new confirmations count. Reflects Block time
 * @param {string} crypto crypto name
 * @returns {number}
 */
export const getTxUpdateInterval = function (crypto) {
  const mainCoin = CryptosInfo[crypto].mainCoin || crypto

  return CryptosInfo[mainCoin].txFetchInfo?.newPendingInterval || DEFAULT_TX_FETCH_INTERVAL
}
