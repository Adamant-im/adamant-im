import Web3 from 'web3'
import abiDecoder from 'abi-decoder'
import Tx from 'ethereumjs-tx'
import { toBuffer } from 'ethereumjs-util'

import getEndpointUrl from '../../../lib/getEndpointUrl'
import * as admApi from '../../../lib/adamant-api'
import * as ethUtils from '../../../lib/eth-utils'
import { ERC20_TRANSFER_GAS } from '../../../lib/constants'
import Erc20 from './erc20.abi.json'

/** Max number of attempts to retrieve the transaction details */
const MAX_ATTEMPTS = 150

const endpoint = getEndpointUrl('ETH')
const api = new Web3(new Web3.providers.HttpProvider(endpoint, 2000))
const queue = new ethUtils.BatchQueue(() => api.createBatch())

/** Timestamp of the most recent status update */
let lastStatusUpdate = 0
/** Status update interval */
const STATUS_INTERVAL = 8000

// Setup decoder
abiDecoder.addABI(Erc20)

export default {
  /**
   * Handles `afterLogin` action: generates ETH-account and requests its balance.
   */
  afterLogin: {
    root: true,
    handler (context, passphrase) {
      const account = ethUtils.getAccountFromPassphrase(passphrase)
      context.commit('account', account)
      context.dispatch('updateStatus')
      queue.start()
    }
  },

  /** Resets module state */
  reset: {
    root: true,
    handler (context) {
      queue.stop()
      context.commit('reset')
    }
  },

  /** Handles store rehydratation: generates an account if one is not ready yet */
  rehydrate: {
    root: true,
    handler (context) {
      const passphrase = context.rootGetters.getPassPhrase
      const address = context.state.address

      if (!address && passphrase) {
        const account = ethUtils.getAccountFromPassphrase(passphrase)
        context.commit('account', account)
      }

      context.dispatch('updateStatus')

      queue.start()
    }
  },

  /** Updates crypto balance info */
  updateStatus (context) {
    if (!context.state.address) return

    const contract = api.eth.contract(Erc20).at(context.state.contractAddress)

    ethUtils.promisify(contract.balanceOf.call, context.state.address)
      .then(
        balance => context.commit('balance', ethUtils.toFraction(balance.toString(10), context.state.decimals)),
        error => console.warn(`${context.state.crypto} balance failed: `, error)
      )
      .then(() => {
        const delay = Math.max(0, STATUS_INTERVAL - Date.now() + lastStatusUpdate)
        setTimeout(() => {
          if (context.state.address) {
            lastStatusUpdate = Date.now()
            context.dispatch('updateStatus')
          }
        }, delay)
      })
  },

  sendTokens (context, { amount, admAddress, ethAddress, comments }) {
    ethAddress = ethAddress.trim()
    const crypto = context.state.crypto
    const contract = api.eth.contract(Erc20).at(context.state.contractAddress)

    const ethTx = {
      from: context.state.address,
      to: context.state.contractAddress,
      value: api.fromDecimal('0'),
      gasLimit: api.fromDecimal(ERC20_TRANSFER_GAS),
      gasPrice: api.fromDecimal(context.getters.gasPrice),
      data: contract.transfer.getData(ethAddress, ethUtils.toWhole(amount, context.state.decimals))
    }

    return ethUtils.promisify(api.eth.getTransactionCount, context.state.address, 'pending')
      .then(count => {
        if (count) ethTx.nonce = count

        const tx = new Tx(ethTx)
        tx.sign(toBuffer(context.state.privateKey))
        const serialized = '0x' + tx.serialize().toString('hex')
        const hash = api.sha3(serialized, { encoding: 'hex' })

        if (!admAddress) return serialized
        // Send a special message to indicate that we're performing an ETH transfer
        const type = crypto.toLowerCase() + '_transaction'
        const msg = { type, amount, hash, comments }
        return admApi.sendSpecialMessage(admAddress, msg)
          .then(() => {
            console.log('ADM message has been sent', msg)
            return serialized
          })
          .catch((error) => {
            console.log(`Failed to send "${type}"`, error)
            return Promise.reject(new Error('adm_message'))
          })
      })
      .then(tx => {
        return ethUtils.promisify(api.eth.sendRawTransaction, tx).then(
          hash => ({ hash }),
          error => ({ error })
        )
      })
      .then(({ hash, error }) => {
        if (error) {
          console.error(`Failed to send ${crypto} transaction`, error)
          context.commit('transaction', { hash, status: 'ERROR' })
          throw error
        } else {
          console.log('ETH transaction has been sent')

          const timestamp = Date.now()

          context.commit('transaction', {
            hash,
            senderId: ethTx.from,
            recipientId: ethAddress,
            amount,
            fee: ethUtils.calculateFee(ethTx.gas, ethTx.gasPrice),
            status: 'PENDING',
            timestamp,
            gasPrice: ethTx.gasPrice
          })

          context.dispatch('getTransaction', { hash, timestamp, isNew: true })

          return hash
        }
      })
  },

  /**
   * Enqueues a background request to retrieve the transaction details
   * @param {object} context Vuex action context
   * @param {{hash: string, timestamp: number, amount: number}} payload hash and timestamp of the transaction to fetch
   */
  getTransaction (context, payload) {
    const existing = context.state.transactions[payload.hash]
    if (existing && existing.status !== 'PENDING') return

    // Set a stub so far
    context.commit('transaction', {
      hash: payload.hash,
      timestamp: payload.timestamp,
      amount: payload.amount,
      status: 'PENDING'
    })

    const key = 'transaction:' + payload.hash
    const supplier = () => api.eth.getTransaction.request(payload.hash, (err, tx) => {
      if (!err && tx && tx.input) {
        let recipientId = null
        let amount = null

        const decoded = abiDecoder.decodeMethod(tx.input)
        if (decoded && decoded.name === 'transfer') {
          decoded.params.forEach(x => {
            if (x.name === '_to') recipientId = x.value
            if (x.name === '_value') amount = ethUtils.toFraction(x.value, context.state.decimals)
          })
        }

        if (recipientId) {
          const transaction = {
            hash: tx.hash,
            senderId: tx.from,
            timestamp: payload.timestamp, // TODO: fetch from block?
            blockNumber: tx.blockNumber,
            amount,
            recipientId,
            gasPrice: tx.gasPrice.toNumber(10)
          }

          context.commit('transaction', transaction)

          // Fetch receipt details: status and actual gas consumption
          const { attempt, ...receiptPayload } = payload
          context.dispatch('getTransactionReceipt', receiptPayload)
        }
      }

      if (!tx && payload.attempt === MAX_ATTEMPTS) {
        // Give up, if transaction could not be found after so many attempts
        context.commit('transaction', { hash: tx.hash, status: 'ERROR' })
      } else if (err || (tx && !tx.blockNumber) || (!tx && payload.isNew)) {
        // In case of an error or a pending transaction fetch its details once again later
        // Increment attempt counter, if no transaction was found so far
        const newPayload = tx ? payload : { ...payload, attempt: 1 + (payload.attempt || 0) }
        context.dispatch('getTransaction', newPayload)
      }
    })

    queue.enqueue(key, supplier)
  },

  /**
   * Retrieves transaction receipt info: status and actual gas consumption.
   * @param {any} context Vuex action context
   * @param {{ hash: String, isNew: Boolean}} payload action payload
   */
  getTransactionReceipt (context, payload) {
    const transaction = context.state.transactions[payload.hash]
    if (!transaction) return

    const gasPrice = transaction.gasPrice

    const supplier = () => api.eth.getTransactionReceipt.request(payload.hash, (err, tx) => {
      if (!err && tx) {
        context.commit('transaction', {
          hash: payload.hash,
          fee: ethUtils.calculateFee(tx.gasUsed, gasPrice),
          status: tx.status ? 'SUCCESS' : 'ERROR'
        })
      }

      if (!tx && payload.attempt === MAX_ATTEMPTS) {
        // Give up, if transaction could not be found after so many attempts
        context.commit('transaction', { hash: tx.hash, status: 'ERROR' })
      } else if (err || (tx && !tx.blockNumber) || (!tx && payload.isNew)) {
        // In case of an error or a pending transaction fetch its receipt once again later
        // Increment attempt counter, if no transaction was found so far
        const newPayload = tx ? payload : { ...payload, attempt: 1 + (payload.attempt || 0) }
        context.dispatch('getTransactionReceipt', newPayload)
      }
    })

    queue.enqueue('transactionReceipt:' + payload.hash, supplier)
  }
}
