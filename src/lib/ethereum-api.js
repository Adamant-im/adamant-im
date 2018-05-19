import Mnemonic from 'bitcore-mnemonic'
import hdkey from 'hdkey'
import Web3 from 'web3'

import config from '../config.json'

const HD_KEY_PATH = "m/44'/60'/3'/1/0"

class EthereumApi {
  /**
   * Creates new instance of `EthereumApi`
   * @param {{protocol: String, ip: String, port: String, path: String}} endpoint ETH node endpoint
   */
  constructor (endpoint) {
    const url = [endpoint.protocol, '://', endpoint.ip, endpoint.port ? (':' + endpoint.port) : '', endpoint.path].join('')
    this._web3 = new Web3(new Web3.providers.HttpProvider(url))
  }

  /**
   * Unlocks ETH account: generates address and creates an account instance.
   * @param {String} passPhrase 12-word passphrase
   */
  unlock (passPhrase = '') {
    const mnemonic = new Mnemonic(passPhrase, Mnemonic.Words.ENGLISH)
    const seed = mnemonic.toSeed()
    const privateKey = hdkey.fromMasterSeed(seed).derive(HD_KEY_PATH)._privateKey

    this._account = this._web3.eth.accounts.privateKeyToAccount('0x' + privateKey.toString('hex'))
  }

  /**
   * Retrieves ETH account balance as a string (units - ETH)
   * @returns {Promise<String>}
   */
  getBalance () {
    return this._web3.eth.getBalance(this.account.address)
      .then(balance => this._web3.utils.fromWei(balance, 'ether'))
  }

  /**
   * Returns ETH account address
   * @returns {String}
   */
  getAddress () {
    return this.account.address
  }

  /**
   * Helper property to check if account has already been unlocked
   */
  get account () {
    const acc = this._account
    if (!acc) throw new Error('Account has not yet been unlocked')
    return acc
  }
}

export default function install (Vue) {
  const endpoints = config.server.eth
  const index = Math.floor(Math.random() * endpoints.length)

  if (!Vue.prototype.api) {
    Vue.prototype.api = { }
  }

  Vue.prototype.api.eth = new EthereumApi(endpoints[index])
}
