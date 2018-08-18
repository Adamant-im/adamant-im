import web3utils from 'web3-utils'
import Mnemonic from 'bitcore-mnemonic'
import hdkey from 'hdkey'

const HD_KEY_PATH = "m/44'/60'/3'/1/0"
const BN = web3utils.BN

/**
 * Converts Wei amount to Ether.
 * @param {string | number} wei Wei amount
 */
export function toEther (wei) {
  return web3utils.fromWei(String(wei), 'ether')
}

/**
 * Converts Ether amount to Wei.
 * @param {string | number} eth Ether amount
 */
export function toWei (eth) {
  return web3utils.toWei(String(eth), 'ether')
}

/**
 * Generates a ETH private key from the passphrase specified.
 * @param {string} passphrase user-defined passphrase
 * @returns {string}
 */
export function privateKeyFromPassphrase (passphrase) {
  const mnemonic = new Mnemonic(passphrase, Mnemonic.Words.ENGLISH)
  const seed = mnemonic.toSeed()
  const privateKey = hdkey.fromMasterSeed(seed).derive(HD_KEY_PATH)._privateKey

  return '0x' + privateKey.toString('hex')
}

export function toWhole (amount, decimals) {
  let [whole, fraction] = String(amount).split('.')
  if (!whole) whole = '0'
  if (!fraction) fraction = '0'

  while (decimals - fraction.length > 0) {
    fraction += '0'
  }

  const num = new BN(whole)
    .mul(new BN(10).pow(new BN(decimals)))
    .add(new BN(fraction))
    .toString(10)

  return num
}

export function toFraction (amount, decimals, separator = '.') {
  amount = `${amount}`

  const whole = amount.substr(0, amount.length - decimals).replace(/^0+/, '') || '0'
  const fraction = amount.substr(amount.length - decimals).replace(/0+$/, '')

  return whole + (fraction ? separator + fraction : '')
}

export class BatchQueue {
  constructor (Web3BatchRequest) {
    this.Web3BatchRequest = Web3BatchRequest
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

    const batch = new this.Web3BatchRequest()
    requests.forEach(x => x.requests.forEach(r => batch.add(r)))

    batch.execute()
  }
}
