/**
 * Returns real timestamp by ADM timestamp.
 * @param {number} admTimestamp
 */
export function getRealTimestamp(admTimestamp) {
  const foundationDate = Date.UTC(2017, 8, 2, 17, 0, 0, 0)

  return parseInt(admTimestamp) * 1000 + foundationDate
}
