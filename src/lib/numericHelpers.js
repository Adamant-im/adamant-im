/**
 * Provides method for convert a number with specified options:
 * 1. Dot as separator of fraction.
 * 2. Dynamic precision range (no trailing zeros).
 * 3. Without grouping of integer part.
 * @param {number} precision
 * @returns {function}
 */
export function formatNumber(precision = 8) {
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
 * @param {any} abstract Number or string-number.
 * @returns {boolean}
 */
export function isNumeric(abstract) {
  return !isNaN(parseFloat(abstract)) && isFinite(abstract)
}

/**
 * Checks if number is finite
 * @param {number} value Number to validate
 * @return {boolean}
 */
export function isNumber(value) {
  if (typeof value !== 'number' || isNaN(value) || !Number.isFinite(value)) {
    return false
  } else {
    return true
  }
}

/**
 * Checks if number is finite and greater, than 0
 * @param {number} value Number to validate
 * @return {boolean}
 */
export function isPositiveNumber(value) {
  if (!isNumber(value) || value <= 0) {
    return false
  } else {
    return true
  }
}
