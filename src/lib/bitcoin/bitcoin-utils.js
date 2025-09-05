import * as bitcoin from 'bitcoinjs-lib'
import { BigNumber } from '@/lib/bignumber'

/**
 * Checks if the supplied string is a valid BTC address
 * @param {string} address address to check
 * @returns {boolean}
 */
export function isValidAddress(address) {
  try {
    bitcoin.address.toOutputScript(address)
  } catch {
    return false
  }

  return true
}

export function convertToSmallestUnit(amount, multiplier) {
  return Math.floor(new BigNumber(amount).times(multiplier).toNumber())
}
