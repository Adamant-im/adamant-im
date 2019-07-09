import Web3 from 'web3'
import Tx from 'ethereumjs-tx'
import { toBuffer } from 'ethereumjs-util'

import getEndpointUrl from '../../../lib/getEndpointUrl'
import * as utils from '../../../lib/eth-utils'
import { getTransactions } from '../../../lib/eth-index'

/** Max number of attempts to retrieve the transaction details */
const MAX_ATTEMPTS = 150

const CHUNK_SIZE = 25

export default function createActions (config) {
  const endpoint = getEndpointUrl('ETH')
  const api = new Web3(new Web3.providers.HttpProvider(endpoint, 10000))
  const queue = new utils.BatchQueue(() => api.createBatch())

  const {
    onInit = (() => { }),
    initTransaction,
    parseTransaction,
    createSpecificActions
  } = config

  return {
    ...createSpecificActions(api, queue),

    /**
     * Handles `afterLogin` action: generates ETH-account and requests its balance.
     */
    afterLogin: {
      root: true,
      handler (context, passphrase) {
        const account = utils.getAccountFromPassphrase(passphrase)
        context.commit('account', account)
        context.dispatch('updateStatus')
        queue.start()

        onInit(context)
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
          onInit(context)
        }

        context.dispatch('updateStatus')

        queue.start()
      }
    },

    sendTokens (context, { amount, admAddress, address, comments }) {
      address = address.trim()
      const crypto = context.state.crypto
      const ethTx = initTransaction(api, context, address, amount)

      return utils.promisify(api.eth.getTransactionCount, context.state.address, 'pending')
        .then(count => {
          if (count) ethTx.nonce = count

          const tx = new Tx(ethTx)
          tx.sign(toBuffer(context.state.privateKey))
          const serialized = '0x' + tx.serialize().toString('hex')
          const hash = api.sha3(serialized, { encoding: 'hex' })

          if (!admAddress) {
            return serialized
          }

          const msgPayload = {
            address: admAddress,
            amount,
            comments,
            crypto,
            hash
          }

          // Send a special message to indicate that we're performing an ETH transfer
          return context.dispatch('sendCryptoTransferMessage', msgPayload, { root: true })
            .then(success => success ? serialized : Promise.reject(new Error('adm_message')))
        })
        .then(tx => {
          return utils.promisify(api.eth.sendRawTransaction, tx).then(
            hash => ({ hash }),
            error => ({ error })
          )
        })
        .then(({ hash, error }) => {
          if (error) {
            console.error(`Failed to send ${crypto} transaction`, error)
            context.commit('transactions', [{ hash, status: 'ERROR' }])
            throw error
          } else {
            context.commit('transactions', [{
              hash,
              senderId: ethTx.from,
              recipientId: address,
              amount,
              fee: utils.calculateFee(ethTx.gas, ethTx.gasPrice),
              status: 'PENDING',
              timestamp: Date.now(),
              gasPrice: ethTx.gasPrice
            }])
            context.dispatch('getTransaction', { hash, isNew: true, direction: 'from' })

            return hash
          }
        })
    },

    /**
     * Retrieves block info: timestamp.
     * @param {any} context Vuex action context
     * @param {{ attempt: Number, blockNumber: Number, hash: String }} payload action payload
     */
    getBlock (context, payload) {
      const transaction = context.state.transactions[payload.hash]
      if (!transaction) return

      const supplier = () => api.eth.getBlock.request(payload.blockNumber, (err, tx) => {
        if (!err && tx) {
          context.commit('transactions', [{
            hash: payload.hash,
            timestamp: tx.timestamp * 1000
          }])
        }
        if (!tx && payload.attempt === MAX_ATTEMPTS) {
          // Give up, if transaction could not be found after so many attempts
          context.commit('transactions', [{ hash: tx.hash, status: 'ERROR' }])
        } else if (err || !tx || !tx.status) {
          // In case of an error or a pending transaction fetch its receipt once again later
          // Increment attempt counter, if no transaction was found so far
          const newPayload = { ...payload, attempt: 1 + (payload.attempt || 0) }
          context.dispatch('getBlock', newPayload)
        }
      })

      queue.enqueue('block:' + payload.blockNumber, supplier)
    },

    /**
     * Enqueues a background request to retrieve the transaction details
     * @param {object} context Vuex action context
     * @param {{hash: string, force: boolean, timestamp: number, amount: number, direction: 'from' | 'to'}} payload hash and timestamp of the transaction to fetch
     */
    getTransaction (context, payload) {
      const existing = context.state.transactions[payload.hash]
      if (existing && existing.status !== 'PENDING' && !payload.force) return

      // Set a stub so far
      if (!existing || existing.status === 'ERROR') {
        context.commit('transactions', [{
          hash: payload.hash,
          timestamp: payload.timestamp,
          amount: payload.amount,
          status: existing ? existing.status : 'PENDING',
          direction: payload.direction
        }])
      }

      const key = 'transaction:' + payload.hash
      const supplier = () => api.eth.getTransaction.request(payload.hash, (err, tx) => {
        if (!err && tx && tx.input) {
          let transaction = parseTransaction(context, tx)
          if (transaction) {
            context.commit('transactions', [transaction])

            // Fetch receipt details: status and actual gas consumption
            const { attempt, ...receiptPayload } = payload
            context.dispatch('getTransactionReceipt', receiptPayload)
            context.dispatch('getBlock', {
              ...payload,
              blockNumber: transaction.blockNumber
            })
          }
        }
        if (!tx && payload.attempt === MAX_ATTEMPTS) {
          // Give up, if transaction could not be found after so many attempts
          context.commit('transactions', [{ hash: payload.hash, status: 'ERROR' }])
        } else if (err || !tx) {
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
          context.commit('transactions', [{
            hash: payload.hash,
            fee: utils.calculateFee(tx.gasUsed, gasPrice),
            status: Number(tx.status) ? 'SUCCESS' : 'ERROR'
          }])
        }
        if (!tx && payload.attempt === MAX_ATTEMPTS) {
          // Give up, if transaction could not be found after so many attempts
          context.commit('transactions', [{ hash: tx.hash, status: 'ERROR' }])
        } else if (err || !tx || !tx.status) {
          // In case of an error or a pending transaction fetch its receipt once again later
          // Increment attempt counter, if no transaction was found so far
          const newPayload = { ...payload, attempt: 1 + (payload.attempt || 0) }
          context.dispatch('getTransactionReceipt', newPayload)
        }
      })

      queue.enqueue('transactionReceipt:' + payload.hash, supplier)
    },

    getNewTransactions (context, payload) {
      const { address, maxHeight, contractAddress, decimals } = context.state

      const from = maxHeight > 0 ? maxHeight + 1 : 0
      const limit = from ? undefined : CHUNK_SIZE

      const options = {
        address,
        contract: contractAddress,
        from,
        limit,
        decimals
      }

      context.commit('areRecentLoading', true)

      return getTransactions(options).then(
        result => {
          context.commit('areRecentLoading', false)
          context.commit('transactions', result.items)
        },
        error => {
          context.commit('areRecentLoading', false)
          return Promise.reject(error)
        }
      )
    },

    getOldTransactions (context) {
      // If we already have the most old transaction for this address, no need to request anything
      if (context.state.bottomReached) return Promise.resolve()

      const { address, contractAddress: contract, minHeight, decimals } = context.state

      const options = {
        limit: CHUNK_SIZE,
        address,
        contract,
        decimals
      }
      if (minHeight > 1) {
        options.to = minHeight - 1
      }

      context.commit('areOlderLoading', true)

      return getTransactions(options).then(
        result => {
          context.commit('areOlderLoading', false)
          context.commit('transactions', result.items)

          if (!result.items.length) {
            context.commit('bottom')
          }
        },
        error => {
          context.commit('areOlderLoading', false)
          return Promise.reject(error)
        }
      )
    }
  }
}
