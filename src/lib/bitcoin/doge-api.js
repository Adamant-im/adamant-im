import BtcBaseApi from './btc-base-api'
import { Cryptos } from '../constants'
import { BigNumber } from '../bignumber'
import * as bitcoin from 'bitcoinjs-lib'
import { isPositiveNumber } from '../numericHelpers'
import { ECPairFactory } from 'ecpair'
import * as tinysecp from 'tiny-secp256k1'
import { convertToSmallestUnit } from './bitcoin-utils'
import { dogeIndexer } from '../../lib/nodes'

const ECPairAPI = ECPairFactory(tinysecp)

const POST_CONFIG = {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
}

export const CHUNK_SIZE = 20
// P2PKH output size (https://gist.github.com/junderw/b43af3253ea5865ed52cb51c200ac19c)
export const OUTPUTS_COMPENSATION = 34 * 4
export const NB_BLOCKS = 5 // Number of last blocks

export default class DogeApi extends BtcBaseApi {
  constructor(passphrase) {
    super(Cryptos.DOGE, passphrase)
  }

  /**
   * @override
   */
  getBalance() {
    return this._get(`/api/addr/${this.address}/balance`).then(
      (balance) => Number(balance) / this.multiplier
    )
  }

  async getFeePerByte() {
    const lastBlocksFee = await this._get(`/api/utils/estimatefee?nbBlocks=${NB_BLOCKS}`)
    return lastBlocksFee[NB_BLOCKS] / 1024
  }

  /** @override */
  async buildTransaction(address, amount, unspents, fee) {
    const localAmount = convertToSmallestUnit(amount, this.multiplier)
    const heldFee = convertToSmallestUnit(fee, this.multiplier)

    const psbt = new bitcoin.Psbt({
      network: this._network
    })
    psbt.setVersion(1)
    psbt.setMaximumFeeRate(heldFee)

    const target = localAmount + heldFee
    let transferAmount = 0
    let inputsCount = 0
    let estimatedTxBytes = 0

    for (const tx of unspents) {
      if (transferAmount >= target) {
        break
      }
      const buffer = Buffer.from(tx.txHex, 'hex')
      psbt.addInput({
        hash: tx.txid,
        index: tx.vout,
        nonWitnessUtxo: buffer
      })
      transferAmount += tx.amount
      estimatedTxBytes += buffer.length
      inputsCount++
    }

    transferAmount = Math.floor(transferAmount)

    psbt.addOutput({
      address,
      value: localAmount
    })

    // Estimated fee based on https://github.com/dogecoin/dogecoin/blob/master/doc/fee-recommendation.md
    const currentFeeRate = await this.getFeePerByte()
    let estimatedFee = Math.floor(
      new BigNumber(currentFeeRate)
        .times(estimatedTxBytes + OUTPUTS_COMPENSATION)
        .times(this.multiplier)
        .toNumber()
    )

    estimatedFee = Math.min(estimatedFee, heldFee)

    // This is a necessary step
    // If we'll not add a difference to output, it will burn in hell
    const difference = transferAmount - localAmount - estimatedFee
    if (isPositiveNumber(difference)) {
      psbt.addOutput({
        address: this._address,
        value: difference
      })
    }

    for (let i = 0; i < inputsCount; ++i) {
      psbt.signInput(i, this._keyPair)
      psbt.validateSignaturesOfInput(i, this._validator)
    }

    psbt.finalizeAllInputs()
    const tx = psbt.extractTransaction()

    return tx.toHex()
  }

  /** @override */
  sendTransaction(txHex) {
    return this._post('/api/tx/send', { rawtx: txHex }).then((res) => res.txid)
  }

  /** @override */
  getTransaction(txid) {
    return this._get(`/api/tx/${txid}`).then((tx) => this._mapTransaction(tx))
  }

  /** @override */
  async getTransactionHex(txid) {
    const { rawtx } = await this._get(`/api/rawtx/${txid}`)
    return rawtx
  }

  /** @override */
  getTransactions({ from = 0 }) {
    const to = from + CHUNK_SIZE
    return this._get(`/api/addrs/${this.address}/txs`, { from, to }).then((resp) => ({
      ...resp,
      hasMore: to < resp.totalItems,
      items: resp.items.map((tx) => this._mapTransaction(tx))
    }))
  }

  /** @override */
  getUnspents() {
    return this._get(`/api/addr/${this.address}/utxo?noCache=1`).then((unspents) => {
      return unspents.map((tx) => ({
        ...tx,
        amount: new BigNumber(tx.amount).times(this.multiplier).toNumber()
      }))
    })
  }

  /** Executes a GET request to the DOGE API */
  _get(url, params) {
    return dogeIndexer
      .useClient((client) => client.get(url, { params }))
      .then((response) => response.data)
  }

  /** Executes a POST request to the DOGE API */
  _post(url, data) {
    return dogeIndexer
      .useClient((client) => client.post(url, data, POST_CONFIG))
      .then((response) => response.data)
  }

  _validator(pubkey, msghash, signature) {
    return ECPairAPI.fromPublicKey(pubkey).verify(msghash, signature)
  }
}
