/**
 * Is number and not Infinity or NaN.
 *
 * @param {any} Number or string-number.
 * @returns {boolean}
 */
export function isNumeric (abstract) {
  return !isNaN(parseFloat(abstract)) && isFinite(abstract)
}
