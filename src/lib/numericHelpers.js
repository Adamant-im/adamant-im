/**
 * Provides method for convert a number with specified options:
 * 1. Dot as separator of fraction.
 * 2. Dynamic precision range (no trailing zeros).
 * 3. Without grouping of integer part.
 * @param {number} precision
 * @returns {function}
 */
export function formatNumber (precision = 8) {
  const intl = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: precision,
    minimumFractionDigits: 0,
    useGrouping: false
  })
  return intl.format
}

/**
 * Is number and not Infinity or NaN.
 *
 * @param {any} Number or string-number.
 * @returns {boolean}
 */
export function isNumeric (abstract) {
  return !isNaN(parseFloat(abstract)) && isFinite(abstract)
}
