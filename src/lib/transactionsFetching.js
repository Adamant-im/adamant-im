import { Cryptos, isErc20 } from './constants'

/** Pending transaction may be not known to blockchain yet */

/** Max number of attempts to fetch a pending transaction */
export const OLD_PENDING_ATTEMPTS = 3
export const NEW_PENDING_ATTEMPTS = 20

/** Interval (ms) between attempts to fetch an old pending transaction */
export const OLD_PENDING_INTERVAL = 5 * 1000

/**
 * Returns `true` if the transaction with the specified timestamp can be considered as new
 * ~ Timestamp less then 20 * Block time
 * @param {number} timestamp the timestamp to test
 * @param {string} crypto crypto name
 * @returns {boolean}
 */
export const isNew = (timestamp, crypto) => (Date.now() - timestamp) < getTxUpdateInterval(crypto) * NEW_PENDING_ATTEMPTS

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
    return OLD_PENDING_INTERVAL
  }
}

/**
 * Returns a retry count (times) for a pending transaction details re-fetching
 * @param {number} timestamp transaction timestamp
 * @param {string} crypto crypto name
 * @returns {number}
 */
export const getPendingTxRetryCount = function (timestamp, crypto) {
  if (isNew(timestamp, crypto)) {
    return NEW_PENDING_ATTEMPTS
  } else {
    return OLD_PENDING_ATTEMPTS
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
  switch (crypto) {
    case Cryptos.ADM:
      return 5000
    case Cryptos.LSK:
      return 10000
    case Cryptos.ETH:
      return 10000
    case Cryptos.DOGE:
      return 60000
    case Cryptos.DASH:
      return 60000
    case Cryptos.BTC:
      return 300000 // 5 min
    default:
      return 30000
  }
}
