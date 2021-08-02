import * as bitcoin from 'bitcoinjs-lib'

/**
 * Checks if the supplied string is a valid BTC address
 * @param {string} address address to check
 * @returns {boolean}
 */
export function isValidAddress (address) {
  try {
    bitcoin.address.toOutputScript(address)
  } catch (e) {
    return false
  }

  return true
}
