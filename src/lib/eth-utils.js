import Mnemonic from 'bitcore-mnemonic'
import hdkey from 'hdkey'
import Web3 from 'web3'
import { BN, bufferToHex, privateToAddress } from 'ethereumjs-util'

const HD_KEY_PATH = "m/44'/60'/3'/1/0"
const web3 = new Web3()

/**
 * Converts Wei amount to Ether.
 * @param {string | number} wei Wei amount
 */
export function toEther (wei) {
  return web3.fromWei(String(wei), 'ether')
}

/**
 * Converts Ether amount to Wei.
 * @param {string | number} eth Ether amount
 */
export function toWei (eth) {
  return web3.toWei(String(eth), 'ether')
}

/**
 * Generates a ETH account from the passphrase specified.
 * @param {string} passphrase user-defined passphrase
 * @returns {{address: String, privateKey: Buffer}}
 */
export function getAccountFromPassphrase (passphrase) {
  const mnemonic = new Mnemonic(passphrase, Mnemonic.Words.ENGLISH)
  const seed = mnemonic.toSeed()
  const privateKey = hdkey.fromMasterSeed(seed).derive(HD_KEY_PATH)._privateKey

  return {
    address: bufferToHex(privateToAddress(privateKey)),
    privateKey: bufferToHex(privateKey)
  }
}

export function calculateFee (gasUsed, gasPrice) {
  const gas = new BN(gasUsed, 10)
  const price = new BN(gasPrice, 10)
  const fee = gas.mul(price).toString(10)
  return toEther(fee)
}

export function toWhole (amount, decimals) {
  let [whole, fraction] = Number(amount).toFixed(decimals).replace(/0+$/, '').split('.')
  if (!whole) whole = '0'
  if (!fraction) fraction = '0'

  while (decimals - fraction.length > 0) {
    fraction += '0'
  }

  const num = new BN(whole, 10)
    .mul(new BN(10, 10).pow(new BN(decimals, 10)))
    .add(new BN(fraction, 10))
    .toString(10)

  return num
}

export function toFraction (amount, decimals, separator = '.') {
  amount = `${amount}`
  const len = amount.length

  const whole = len <= decimals
    ? '0'
    : amount.substr(0, amount.length - decimals).replace(/^0+/, '') || '0'

  let fraction = len <= decimals ? amount : amount.substr(amount.length - decimals)
  while (fraction.length < decimals) {
    fraction = '0' + fraction
  }

  fraction = fraction.replace(/0+$/, '')

  return whole + (fraction ? separator + fraction : '')
}

export function promisify (func, ...args) {
  return new Promise((resolve, reject) => {
    func(...args, (error, result) => error ? reject(error) : resolve(result))
  })
}

export class BatchQueue {
  constructor (createBatchRequest) {
    this._createBatchRequest = createBatchRequest
    this._queue = []
    this._timer = null
  }

  enqueue (key, supplier) {
    if (typeof supplier !== 'function') return
    if (this._queue.some(x => x.key === key)) return

    let requests = supplier()
    this._queue.push({ key, requests: Array.isArray(requests) ? requests : [requests] })
  }

  start () {
    this.stop()
    this._timer = setInterval(() => this._execute(), 2000)
  }

  stop () {
    clearInterval(this._timer)
  }

  _execute () {
    const requests = this._queue.splice(0, 20)
    if (!requests.length) return

    const batch = this._createBatchRequest()
    requests.forEach(x => x.requests.forEach(r => batch.add(r)))

    batch.execute()
  }
}
