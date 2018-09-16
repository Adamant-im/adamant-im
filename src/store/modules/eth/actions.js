import Web3 from 'web3'
import { isValidAddress, toBuffer } from 'ethereumjs-util'
import Tx from 'ethereumjs-tx'

import getEndpointUrl from '../../../lib/getEndpointUrl'
import * as admApi from '../../../lib/adamant-api'
import * as utils from '../../../lib/eth-utils'

import { Fees, ETH_TRANSFER_GAS } from '../../../lib/constants'

const KVS_ADDRESS = 'eth:address'
/** Max number of attempts to retrieve the transaction details */
const MAX_ATTEMPTS = 150

const endpoint = getEndpointUrl('ETH')
const api = new Web3(new Web3.providers.HttpProvider(endpoint, 2000))
const queue = new utils.BatchQueue(() => api.createBatch())

/** Timestamp of the most recent status update */
let lastStatusUpdate = 0
/** Status update interval */
const STATUS_INTERVAL = 8000

let isAddressBeingStored = null
/**
 * Stores ETH address to the Adamant KVS if it's not there yet
 * @param {*} context
 */
function storeEthAddress (context) {
  if (isAddressBeingStored) return
  if (!admApi.isReady()) return
  if (!context.state.address) return
  if (context.rootState.balance < Fees.KVS) return
  if (context.state.isPublished) return

  isAddressBeingStored = true
  admApi.getStored(KVS_ADDRESS)
    .then(address => (address)
      ? true
      : admApi.storeValue(KVS_ADDRESS, context.state.address).then(response => response.success)
    )
    .then(
      success => {
        isAddressBeingStored = false
        if (success) context.commit('isPublished')
      },
      () => { isAddressBeingStored = false }
    )
}

export default {
  /**
   * Handles `afterLogin` action: generates ETH-account and requests its balance.
   */
  afterLogin: {
    root: true,
    handler (context, passphrase) {
      const account = utils.getAccountFromPassphrase(passphrase)
      context.commit('account', account)
      context.dispatch('updateStatus')

      // Store ETH address into the KVS if it's not there yet and user has
      // enough ADM for this transaction
      storeEthAddress(context)

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
        const account = utils.getAccountFromPassphrase(passphrase)
        context.commit('account', account)
        storeEthAddress(context)
      }

      context.dispatch('updateStatus')

      queue.start()
    }
  },

  /** On account update this handler ensures that ETH address is in the KVS */
  updateAccount: {
    root: true,
    handler (context) {
      storeEthAddress(context)
    }
  },

  /**
   * Requests ETH account status: balance, gas price, etc.
   * @param {*} context Vuex action context
   */
  updateStatus (context) {
    if (!context.state.address) return

    const supplier = () => {
      if (!context.state.address) return []

      const block = context.state.blockNumber ? Math.max(0, context.state.blockNumber - 12) : 0

      return [
        // Balance
        api.eth.getBalance.request(context.state.address, block || 'latest', (err, balance) => {
          if (!err) context.commit('balance', utils.toEther(balance.toString(10)))
        }),
        // Current gas price
        api.eth.getGasPrice.request((err, price) => {
          if (!err) {
            const gasPrice = 3 * price.toNumber()
            context.commit('gasPrice', {
              gasPrice,
              fee: utils.calculateFee(ETH_TRANSFER_GAS, gasPrice)
            })
          }
        }),
        // Current block number
        api.eth.getBlockNumber.request((err, number) => {
          if (!err) context.commit('blockNumber', number)
        })
      ]
    }

    const delay = Math.max(0, STATUS_INTERVAL - Date.now() + lastStatusUpdate)
    setTimeout(() => {
      if (context.state.address) {
        queue.enqueue('status', supplier)
        lastStatusUpdate = Date.now()
        context.dispatch('updateStatus')
      }
    }, delay)
  },

  /**
   * Sends tokens to the specified ETH address.
   *
   * @param {*} context Vuex action context
   * @param {string|number} amount amount to send
   * @param {string} receiver receiver ETH-address
   * @returns {Promise<string>} ETH transaction hash
   */
  sendTokens (context, { amount, admAddress, ethAddress, comments }) {
    const ethTx = {
      from: context.state.address,
      to: ethAddress,
      value: api.fromDecimal(utils.toWei(amount)),
      gas: api.fromDecimal(ETH_TRANSFER_GAS),
      gasPrice: api.fromDecimal(context.getters.gasPrice)
    }

    if (!isValidAddress(ethAddress)) {
      return Promise.reject(new Error('invalid_address'))
    }

    return utils.promisify(api.eth.getTransactionCount, context.state.address, 'pending')
      .then(count => {
        if (count) ethTx.nonce = count

        const tx = new Tx(ethTx)
        tx.sign(toBuffer(context.state.privateKey))
        const serialized = '0x' + tx.serialize().toString('hex')
        const hash = api.sha3(serialized, { encoding: 'hex' })

        if (!admAddress) return serialized
        // Send a special message to indicate that we're performing an ETH transfer
        const msg = { type: 'eth_transaction', amount, hash, comments }
        return admApi.sendSpecialMessage(admAddress, msg)
          .then(() => {
            console.log('ADM message has been sent', msg)
            return serialized
          })
          .catch((error) => {
            console.log('Failed to send "eth_transaction"', error)
            return Promise.reject(new Error('adm_message'))
          })
      })
      .then(tx => {
        return utils.promisify(api.eth.sendRawTransaction, tx).then(
          hash => ({ hash }),
          error => ({ error })
        )
      })
      .then(({ hash, error }) => {
        if (error) {
          console.error('Failed to send ETH transaction', error)
          context.commit('setTransaction', { hash, status: 'ERROR' })
          throw error
        } else {
          console.log('ETH transaction has been sent')

          const timestamp = Date.now()

          context.commit('setTransaction', {
            hash,
            senderId: ethTx.from,
            recipientId: ethTx.to,
            amount,
            fee: utils.calculateFee(ethTx.gas, ethTx.gasPrice),
            status: 'PENDING',
            timestamp
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
    context.commit('setTransaction', {
      hash: payload.hash,
      timestamp: payload.timestamp,
      amount: payload.amount,
      status: 'PENDING'
    })

    const key = 'transaction:' + payload.hash
    const supplier = () => api.eth.getTransaction.request(payload.hash, (err, tx) => {
      if (!err && tx) {
        const transaction = {
          hash: tx.hash,
          senderId: tx.from,
          recipientId: tx.to,
          amount: utils.toEther(tx.value.toString(10)),
          fee: utils.calculateFee(tx.gas, tx.gasPrice.toString(10)),
          status: tx.blockNumber ? 'SUCCESS' : 'PENDING',
          timestamp: payload.timestamp, // TODO: fetch from block?
          blockNumber: tx.blockNumber
        }

        context.commit('setTransaction', transaction)
      }

      if (!tx && payload.attempt === MAX_ATTEMPTS) {
        // Give up, if transaction could not be found after so many attempts
        context.commit('setTransaction', { hash: tx.hash, status: 'ERROR' })
      } else if (err || (tx && !tx.blockNumber) || (!tx && payload.isNew)) {
        // In case of an error or a pending transaction fetch its details once again later
        // Increment attempt counter, if no transaction was found so far
        const newPayload = tx ? payload : { ...payload, attempt: 1 + (payload.attempt || 0) }
        context.dispatch('getTransaction', newPayload)
      }
    })

    queue.enqueue(key, supplier)
  }
}
