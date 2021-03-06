/**
 * Additional coin-based functions here
 * Example: export function isValidAddress (address)
 * Checks if the supplied string is a valid BTC address
 */

/**
 * Returns real timestamp by LSK timestamp.
 * @param {number} lskTimestamp
 */
export function getRealTimestamp (lskTimestamp) {
  const foundationDate = Date.UTC(2016, 4, 24, 17, 0, 0, 0)
  return parseInt(lskTimestamp) * 1000 + foundationDate
}
