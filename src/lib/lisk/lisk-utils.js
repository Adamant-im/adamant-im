/**
 * Additional coin-based functions here
 */

/**
 * Returns real timestamp by LSK timestamp.
 * @param {number} lskTimestamp
 */
export function getRealTimestamp (lskTimestamp) {
  const foundationDate = Date.UTC(2016, 4, 24, 17, 0, 0, 0)
  return parseInt(lskTimestamp) * 1000 + foundationDate
}

/**
 * Returns LSK timestamp by real timestamp.
 * @param {number} realTimestamp
 */
export function getLiskTimestamp (realTimestamp) {
  const foundationDate = Date.UTC(2016, 4, 24, 17, 0, 0, 0)
  return Math.round((parseInt(realTimestamp - foundationDate) / 1000))
}
