import hdkey from 'hdkey'
import * as web3Utils from 'web3-utils'
import { privateKeyToAccount } from 'web3-eth-accounts'
import BigNumber from 'bignumber.js'
import cache from '@/store/cache.js'
import { INCREASE_FEE_MULTIPLIER } from '@/lib/constants'

const HD_KEY_PATH = "m/44'/60'/3'/1/0"

/**
 * Converts Wei amount to Ether.
 * @param {string | number} wei Wei amount
 */
export function toEther(wei) {
  return web3Utils.fromWei(String(wei), 'ether')
}

/**
 * Converts Ether amount to Wei.
 * @param {string | number} eth Ether amount
 */
export function toWei(eth, unit = 'ether') {
  return web3Utils.toWei(String(eth), unit)
}

/**
 * Generates a ETH account from the passphrase specified.
 * bip39.mnemonicToSeedSync is time consuming, so we use cached value, if possible
 * @param {string} passphrase user-defined passphrase
 * @returns {{address: string, privateKey: string}}
 */
export function getAccountFromPassphrase(passphrase, api) {
  const seed = cache.mnemonicToSeedSync(passphrase)
  const privateKey = web3Utils.bytesToHex(
    hdkey.fromMasterSeed(seed).derive(HD_KEY_PATH)._privateKey
  )
  // web3Account is for user wallet; We don't need it, when exporting a private key
  const web3Account = api ? privateKeyToAccount(privateKey) : undefined

  return {
    web3Account,
    address: web3Account ? web3Account.address : undefined,
    privateKey
  }
}

/**
 * Calculates Tx fee in ETH (not in wei) based on gas price and used gas.
 * @param {string|number} gasUsed used gas, generally number, i. e., 51823
 * @param {string|number} gasPrice gas price in wei. May be string, hex or dec number, i. e., "0x342770c00" (14000000000 wei)
 * @returns {string} fee in ETH
 */
export function calculateFee(gasUsed, gasPrice) {
  // After London hardfork we may not receive gasPrice. Still we change gasPrice to effectiveGasPrice where it's possible
  if (!gasPrice) return '0'
  const gas = BigNumber(gasUsed, 10)
  const price = BigNumber(gasPrice, 10)
  const fee = gas.times(price).toString(10)
  return toEther(fee)
}

/**
 * Transforms amount in token to sats.
 * Used for ERC20 tokens. I. e., 1.00035 RES = 100035 res-sats.
 * @param {string|number} amount value in token
 * @param {string|number} decimals decimal places for token's contract
 * @returns {string} value in sats
 */
export function toWhole(amount, decimals) {
  let [whole, fraction] = Number(amount).toFixed(decimals).replace(/0+$/, '').split('.')
  if (!whole) whole = '0'
  if (!fraction) fraction = '0'

  while (decimals - fraction.length > 0) {
    fraction += '0'
  }

  const num = BigNumber(whole, 10)
    .times(BigNumber(10, 10).pow(BigNumber(decimals, 10)))
    .plus(BigNumber(fraction, 10))
    .toString(10)

  return num
}

/**
 * Transforms amount in token-sats to token.
 * Used for ERC20 tokens. I. e., 100035 res-sats = 1.00035 RES.
 * @param {string|number} amount value in sats
 * @param {string|number} decimals decimal places for token's contract
 * @param {string} separator decimal separator sign
 * @returns {string} value in token
 */
export function toFraction(amount, decimals, separator = '.') {
  amount = `${amount}`
  const len = amount.length

  const whole =
    len <= decimals ? '0' : amount.substr(0, amount.length - decimals).replace(/^0+/, '') || '0'

  let fraction = len <= decimals ? amount : amount.substr(amount.length - decimals)
  while (fraction.length < decimals) {
    fraction = '0' + fraction
  }

  fraction = fraction.replace(/0+$/, '')

  return whole + (fraction ? separator + fraction : '')
}

/**
 * @param {bigint | number} gasLimit
 * @param {number} multiplier
 * @returns {bigint} Increased fee
 */
export function increaseFee(gasLimit, multiplier = INCREASE_FEE_MULTIPLIER) {
  const increasedGasLimit = BigNumber(Number(gasLimit)).multipliedBy(multiplier).toNumber()

  return BigInt(Math.round(increasedGasLimit))
}
