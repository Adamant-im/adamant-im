import * as bitcoin from 'bitcoinjs-lib'
import { BigNumber } from '@/lib/bignumber'

const toRoundedDownIntegerString = (amount, multiplier) => {
  return new BigNumber(amount).times(multiplier).decimalPlaces(0, BigNumber.ROUND_DOWN).toFixed(0)
}

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
  return Number(toRoundedDownIntegerString(amount, multiplier))
}

export function convertToBigIntSmallestUnit(amount, multiplier) {
  return BigInt(toRoundedDownIntegerString(amount, multiplier))
}
