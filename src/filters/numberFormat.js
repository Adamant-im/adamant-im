import BigNumber from '@/lib/bignumber'

/**
 * Format currency amount to a fancy string with symbol
 * @param {number} amount - Amount to format
 * @param {number} precision - number of decimal digits
 * @returns {string}
 */
export default (amount, precision = null) => {
  const formatted = BigNumber(amount).toFixed(precision)
  return `${formatted}`
}
