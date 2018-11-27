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

const MULTIPLIER = 1e8

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

  /**
   * Creates a DOGE transfer transaction hex and ID
   * @param {string} address receiver address
   * @param {number} amount amount to transfer (DOGEs)
   * @returns {{hex: string, txid: string}}
   */
  createTransaction (address = '', amount = 0) {
    amount = Math.floor(Number(amount) * MULTIPLIER)

    return client.get('/get_tx_unspent/DOGE/' + this.address)
      .then(response => {
        const unspents = response.data.data.txs || []

        const txb = new bitcoin.TransactionBuilder(network)
        txb.setVersion(1)

        const target = amount * 1.01
        let transferAmount = 0
        let inputs = 0

        unspents.forEach(tx => {
          const value = Math.floor(tx.value * MULTIPLIER)
          if (transferAmount < target) {
            txb.addInput(tx.txid, inputs++)
            transferAmount += value
          }
        })

        txb.addOutput(address, amount)
        txb.addOutput(this._address, transferAmount - target)

        for (let i = 0; i < inputs; ++i) {
          txb.sign(i, this._keyPair)
        }

        const hex = txb.build().toHex()

        let txid = bitcoin.crypto.sha256(Buffer.from(hex, 'hex'))
        txid = bitcoin.crypto.sha256(Buffer.from(txid))
        txid = txid.toString('hex').match(/.{2}/g).reverse().join('')

        return { hex, txid }
      })
  }
}
