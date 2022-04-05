import BigNumber from '@/lib/bignumber'
import { Cryptos } from '@/lib/constants'

/**
 * Format currency amount to a fancy string without symbol
 * @param {number} amount - Amount to format
 * @param {string} symbol - Currency symbol (ticker)
 * @param {boolean} isAdmBalance - Amount is ADM balance
 * @returns {string}
 */
export default (amount, symbol = Cryptos.ADM, isAdmBalance) => {
  if (amount !== undefined) {
    const formatted = BigNumber(
      !isAdmBalance && symbol === Cryptos.ADM ? amount / 1e8 : amount
    ).toFixed()
    return formatted
  } else {
    return ''
  }
}
