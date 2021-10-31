/**
 * Additional coin-based functions here
 */

/**
 * Returns Millis timestamp by LSK UNIX timestamp (sec)
 * @param {number} liskTimestamp
 */
export function getMillisTimestamp (liskTimestamp) {
  return parseInt(liskTimestamp) * 1000
}

/**
 * Returns LSK timestamp (UNIX in sec) by Millis timestamp
 * @param {number} millisTimestamp
 */
export function getLiskTimestamp (millisTimestamp) {
  return Math.round(parseInt(millisTimestamp) / 1000)
}
