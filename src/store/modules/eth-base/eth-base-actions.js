import Web3Eth from 'web3-eth'

import getEndpointUrl from '../../../lib/getEndpointUrl'
import * as utils from '../../../lib/eth-utils'
import { getTransactions } from '../../../lib/eth-index'
import * as tf from '../../../lib/transactionsFetching'
import { isStringEqualCI } from '@/lib/textHelpers'

/** Interval between attempts to fetch the registered tx details */
const RETRY_TIMEOUT = 20 * 1000
const CHUNK_SIZE = 25

export default function createActions (config) {
  const endpoint = getEndpointUrl('ETH')
  const api = new Web3Eth(endpoint)
  const queue = new utils.BatchQueue(() => new api.BatchRequest())

  const {
    onInit = () => { },
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
        const account = utils.getAccountFromPassphrase(passphrase, api)
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
          const account = utils.getAccountFromPassphrase(passphrase, api)
          context.commit('account', account)
          onInit(context)
        }

        context.dispatch('updateStatus')

        queue.start()
      }
    },

    sendTokens (context, { amount, admAddress, address, comments, increaseFee }) {
      address = address.trim()
      const crypto = context.state.crypto

      return initTransaction(api, context, address, amount, increaseFee).then(ethTx => {
        return api.accounts.signTransaction(ethTx, context.state.privateKey).then(signedTx => {
          const txInfo = {
            signedTx,
            ethTx
          }

          if (!admAddress) {
            return txInfo
          }
          const msgPayload = {
            address: admAddress,
            amount,
            comments,
            crypto,
            hash: signedTx.transactionHash
          }
          // Send a rich ADM message to indicate that we're performing an ETH transfer
          return context.dispatch('sendCryptoTransferMessage', msgPayload, { root: true })
            .then(success => success ? txInfo : Promise.reject(new Error('adm_message')))
        })
      })
        .then(txInfo => {
          return api.sendSignedTransaction(txInfo.signedTx.rawTransaction).then(
            hash => ({ txInfo, hash }),
            error => {
              // Known bug that after Tx sent successfully, this error occurred anyway https://github.com/ethereum/web3.js/issues/3145
              if (!error.toString().includes('Failed to check for transaction receipt')) {
                return { txInfo, error }
              } else {
                return { txInfo, hash: txInfo.signedTx.transactionHash }
              }
            }
          )
        })
        .then((sentTxInfo) => {
          // Since London OpenEthereum (or web3?) update v3.3.0-rc.4, hash is an object, not a hex string
          // Object is a Tx receipt with fields: blockHash, blockNumber, contractAddress, cumulativeGasUsed, effectiveGasPrice,
          // ..from, gasUsed, logs, logsBloom, **status**: true or false, to, transactionHash, transactionIndex
          // Though docs say "The callback will return the 32 bytes transaction hash"
          // https://web3js.readthedocs.io/en/v3.0.0-rc.5/web3-eth.html?highlight=sendSignedTransaction#sendsignedtransaction
          // We suppose result format may change in future, so expect both variants
          if (typeof sentTxInfo.hash === 'object') {
            // Before London hardfork, ethTx included gasPrice
            // But after it, it include fields: from, gas (limit), to, value (hex),
            // ..type: undefined, which interprets as 0 (Legacy)
            // We should take gasPrice from Tx receipt object = effectiveGasPrice
            sentTxInfo.txInfo.ethTx.gasPrice = sentTxInfo.hash.effectiveGasPrice
            sentTxInfo.hash = sentTxInfo.hash.transactionHash
          }

          if (sentTxInfo.error) {
            console.error(`Failed to send ${crypto} transaction`, sentTxInfo.error)
            context.commit('transactions', [{ hash: sentTxInfo.txInfo.signedTx.transactionHash, status: 'REJECTED' }])
            throw sentTxInfo.error
          } else {
            if (!isStringEqualCI(sentTxInfo.hash, sentTxInfo.txInfo.signedTx.transactionHash)) {
              console.warn(`Something wrong with sent ETH tx, computed hash and sent tx differs: ${sentTxInfo.txInfo.signedTx.transactionHash} and ${sentTxInfo.hash}`)
            }

            context.commit('transactions', [{
              hash: sentTxInfo.hash,
              senderId: sentTxInfo.txInfo.ethTx.from,
              recipientId: address,
              amount,
              fee: utils.calculateFee(sentTxInfo.txInfo.ethTx.gas, sentTxInfo.txInfo.ethTx.gasPrice),
              status: 'PENDING',
              timestamp: Date.now(),
              gasPrice: sentTxInfo.txInfo.ethTx.gasPrice
            }])
            context.dispatch('getTransaction', { hash: sentTxInfo.hash, isNew: true, direction: 'from', force: true })

            return sentTxInfo.hash
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

      const supplier = () => api.getBlock.request(payload.blockNumber, (err, block) => {
        if (!err && block) {
          context.commit('transactions', [{
            hash: transaction.hash,
            timestamp: block.timestamp * 1000
          }])
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
      if (existing && !payload.force) return

      if (!existing || payload.dropStatus) {
        payload.updateOnly = false
        context.commit('transactions', [{
          hash: payload.hash,
          timestamp: (existing && existing.timestamp) || payload.timestamp || Date.now(),
          amount: payload.amount,
          status: 'PENDING',
          direction: payload.direction
        }])
      }

      const key = 'transaction:' + payload.hash
      const supplier = () => api.getTransaction.request(payload.hash, (err, tx) => {
        if (!err && tx && tx.input) {
          const transaction = parseTransaction(context, tx)
          const status = existing ? existing.status : 'REGISTERED'
          if (transaction) {
            context.commit('transactions', [{
              ...transaction,
              status
            }])
            // Fetch receipt details: status and actual gas consumption
            const { attempt, ...receiptPayload } = payload
            context.dispatch('getTransactionReceipt', receiptPayload)
            // Now we know that the transaction has been registered by the ETH network.
            // Nothing else to do here, let's proceed to checking its status (see getTransactionReceipt)
            return
          }
        }

        const attempt = payload.attempt || 0
        const retryCount = tf.getPendingTxRetryCount(payload.timestamp || (existing && existing.timestamp), context.state.crypto)
        const retry = attempt < retryCount
        const retryTimeout = tf.getPendingTxRetryTimeout(payload.timestamp || (existing && existing.timestamp), context.state.crypto)

        if (!retry) {
          // Give up, if transaction could not be found after so many attempts
          context.commit('transactions', [{ hash: payload.hash, status: 'REJECTED' }])
        } else if (!payload.updateOnly) {
          // In case of an error or a pending transaction fetch its details once again later
          // Increment attempt counter, if no transaction was found so far
          const newPayload = tx
            ? payload
            : {
                ...payload,
                attempt: attempt + 1,
                force: true,
                updateOnly: false,
                dropStatus: false
              }

          setTimeout(() => context.dispatch('getTransaction', newPayload), retryTimeout)
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

      const supplier = () => api.getTransactionReceipt.request(payload.hash, (err, tx) => {
        let replay = true

        if (!err && tx) {
          const update = {
            hash: payload.hash,
            fee: utils.calculateFee(tx.gasUsed, gasPrice)
          }

          if (Number(tx.status) === 0) {
            // Status "0x0" means that the transaction has been rejected
            update.status = 'REJECTED'
          } else if (tx.blockNumber) {
            // If blockNumber is not null, the transaction is confirmed
            update.status = 'CONFIRMED'
            update.blockNumber = tx.blockNumber
          }

          context.commit('transactions', [update])

          if (tx.blockNumber) {
            context.dispatch('getBlock', {
              ...payload,
              blockNumber: tx.blockNumber
            })
          }

          // Re-fetch tx details if it's status is still unknown
          replay = !update.status
        }

        if (replay) {
          // In case of an error or a pending transaction fetch its receipt once again later
          // Increment attempt counter, if no transaction was found so far
          const newPayload = { ...payload, attempt: 1 + (payload.attempt || 0) }
          setTimeout(() => context.dispatch('getTransactionReceipt', newPayload), RETRY_TIMEOUT)
        }
      })

      queue.enqueue('transactionReceipt:' + payload.hash, supplier)
    },

    /**
     * Updates the transaction details
     * @param {{ dispatch: function }} param0 Vuex context
     * @param {{hash: string}} payload action payload
     */
    updateTransaction ({ dispatch }, payload) {
      return dispatch('getTransaction', { ...payload, force: payload.force, updateOnly: payload.updateOnly })
    },

    getNewTransactions (context, payload) {
      // Magic here helps to refresh Tx list when browser deletes it
      if (Object.keys(context.state.transactions).length < context.state.transactionsCount) {
        context.state.transactionsCount = 0
        context.state.maxHeight = -1
        context.state.minHeight = Infinity
        context.commit('bottom', false)
      }
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
          context.commit('transactions', { transactions: result.items, updateTimestamps: true })
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
          context.commit('transactions', { transactions: result.items, updateTimestamps: true })

          if (!result.items.length) {
            context.commit('bottom', true)
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
