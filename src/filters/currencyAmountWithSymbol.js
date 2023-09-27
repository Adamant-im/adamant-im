import { Cryptos } from '@/lib/constants'
import currencyAmount from './currencyAmount'

/**
 * Format currency amount to a fancy string with symbol
 * @param {number} amount - Amount to format
 * @param {string} symbol - Currency symbol (ticker)
 * @param {boolean} isAdmBalance - Amount is ADM balance
 * @returns {string}
 */
export default (amount, symbol = Cryptos.ADM, isAdmBalance = false) => {
  if (amount !== undefined) {
    return `${currencyAmount(amount, symbol, isAdmBalance)} ${symbol}`
  } else {
    return ''
  }
}
