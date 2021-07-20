/**
 * Format number to a fancy string.
 * Prevents exponential notation, unending fraction and trailing zeroes
 * @param {number} amount Amount to format
 * @param {number} precision Max fraction length
 * @returns {string}
 */
export default (amount, precision = 8) => {
  const [whole, fraction] = Number(amount).toFixed(precision).replace(/0+$/, '').split('.')
  return fraction ? `${whole}.${fraction}` : `${whole}`
}
