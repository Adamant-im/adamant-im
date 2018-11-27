import coininfo from 'coininfo'
import bitcoin from 'bitcoinjs-lib'
import axios from 'axios'

const client = axios.create({
  baseURL: 'https://chain.so/api/v2'
})

const fmt = coininfo.dogecoin.main.toBitcoinJS()
const network = {
  messagePrefix: '\x19' + fmt.name + ' Signed Message:\n',
  bip32: {
    public: fmt.bip32.public,
    private: fmt.bip32.private
  },
  pubKeyHash: fmt.pubKeyHash,
  scriptHash: fmt.scriptHash,
  wif: fmt.wif
}

export default class DogeApi {
  constructor (passphrase) {
    const pwHash = bitcoin.crypto.sha256(Buffer.from(passphrase))
    this._keyPair = bitcoin.ECPair.fromPrivateKey(pwHash, { network })
    this._address = bitcoin.payments.p2pkh({ pubkey: this._keyPair.publicKey, network }).address
  }

  /** Dogecoin public address */
  get address () {
    return this._address
  }

  /**
   * Returns confirmed Doge balance
   * @returns {Promise<string>}
   */
  getBalance () {
    return client.get('/get_address_balance/DOGE/' + this.address)
      .then(({ data }) => data.data && data.data.confirmed_balance)
  }
}
