import { Cryptos, CryptosInfo, isErc20, isInstantSendPossible } from './constants'

/** Pending transaction may be not known to blockchain yet */

/** Max number of attempts to fetch a pending transaction */
export const OLD_PENDING_ATTEMPTS = 3
export const NEW_PENDING_ATTEMPTS = 20

/** Interval (ms) between attempts to fetch an old pending transaction */
export const OLD_PENDING_INTERVAL = 5 * 1000
export const NEW_PENDING_INTERVAL = 30 * 1000

/** Interval (ms) between attempts to fetch an registered transaction, when InstantSend is possible */
export const INSTANT_SEND_INTERVAL = 4 * 1000
/** Time (ms) to consider InstantSend is yet possible */
export const INSTANT_SEND_TIME = 60 * 1000

/**
 * Returns `true` if the transaction with the specified timestamp can be considered as new
 * ~ Timestamp less then 20 * Block time
 * @param {number} timestamp the timestamp to test
 * @param {string} crypto crypto name
 * @returns {boolean}
 */
export const isNew = (timestamp, crypto) =>
  Date.now() - timestamp < getTxUpdateInterval(crypto) * NEW_PENDING_ATTEMPTS

/**
 * Returns a retry interval (ms) for a pending transaction details re-fetching
 * @param {number} timestamp transaction timestamp
 * @param {string} crypto crypto name
 * @returns {number}
 */
export const getPendingTxRetryTimeout = function (timestamp, crypto) {
  if (isNew(timestamp, crypto)) {
    return getTxUpdateInterval(crypto)
  } else {
    return CryptosInfo[crypto].txFetchInfo?.oldPendingInterval || OLD_PENDING_INTERVAL
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
  if (!gotInstantSendAlready && isInstantSendPossible(crypto)) {
    return Date.now() - timestamp < INSTANT_SEND_TIME ? INSTANT_SEND_INTERVAL : regularTimeout
  } else {
    return CryptosInfo[crypto].txFetchInfo?.registeredInterval || regularTimeout
  }
}

/**
 * Returns a retry count (times) for a pending transaction details re-fetching
 * @param {number} timestamp transaction timestamp
 * @param {string} crypto crypto name
 * @returns {number}
 */
export const getPendingTxRetryCount = function (timestamp, crypto) {
  const { txFetchInfo } = CryptosInfo[crypto]

  if (isNew(timestamp, crypto)) {
    return txFetchInfo?.newPendingAttempts || NEW_PENDING_ATTEMPTS
  } else {
    return txFetchInfo?.oldPendingAttempts || OLD_PENDING_ATTEMPTS
  }
}

/**
 * Returns a transaction update interval (ms) to get new confirmations count. Reflects Block time
 * @param {string} crypto crypto name
 * @returns {number}
 */
export const getTxUpdateInterval = function (crypto) {
  if (isErc20(crypto)) {
    crypto = Cryptos.ETH
  }

  return CryptosInfo[crypto].txFetchInfo?.newPendingInterval || NEW_PENDING_INTERVAL
}
