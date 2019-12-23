/** Max number of attempts to fetch a pending transaction */
export const PENDING_ATTEMPTS = 15

/** Interval (ms) between attempts to fetch a new pending transaction */
export const NEW_PENDING_TIMEOUT = 60 * 1000

/** Interval (ms) between attempts to fetch an old pending transaction */
export const OLD_PENDING_TIMEOUT = 5 * 1000

/** Max age (ms) of a transaction that can be considered as new */
export const NEW_TRANSACTION_AGE = 30 * 60 * 1000

/**
 * Returns `true` if the transaction with the specified timestamp can be considered as new.
 * @param {number} timestamp the timestamp to test
 * @returns {boolean}
 */
export const isNew = timestamp => (Date.now() - timestamp) < NEW_TRANSACTION_AGE

/**
 * Returns a retry interval (ms) for a pending transaction details re-fecthing.
 * @param {number} timestamp transaction timestamp
 * @returns {number}
 */
export const getPendingTxRetryTimeout = timestamp => (isNew(timestamp) ? NEW_PENDING_TIMEOUT : OLD_PENDING_TIMEOUT)
