import { BigNumber } from '@/lib/bignumber'
import { AllCryptos } from '@/lib/constants'

/**
 * Format currency amount to a fancy string without symbol
 * @param {number} amount - Amount to format
 * @param {string} symbol - Currency symbol (ticker)
 * @param {boolean} isAdmBalance - Amount is ADM balance
 * @returns {string}
 */
export default (amount, symbol = AllCryptos.ADM, isAdmBalance = false) => {
  if (amount !== undefined) {
    return BigNumber(!isAdmBalance && symbol === AllCryptos.ADM ? amount / 1e8 : amount).toFixed()
  } else {
    return ''
  }
}
