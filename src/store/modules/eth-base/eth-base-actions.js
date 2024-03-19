import BigNumber from 'bignumber.js'
import { TransactionNotFound } from 'web3-errors'

import * as utils from '../../../lib/eth-utils'
import adm from '../../../lib/nodes/adm'
import ethIndexer from '../../../lib/nodes/eth-indexer'
import {
  assertNoPendingTransaction,
  invalidatePendingTransaction,
  createPendingTransaction,
  PendingTxStore
} from '../../../lib/pending-transactions'
import * as tf from '../../../lib/transactionsFetching'
import { signTransaction, TransactionFactory } from 'web3-eth-accounts'
import api from '@/lib/nodes/eth'

/** Interval between attempts to fetch the registered tx details */
const CHUNK_SIZE = 25

export default function createActions(config) {
  const { onInit = () => {}, initTransaction, parseTransaction, createSpecificActions } = config

  return {
    ...createSpecificActions(api),

    /**
     * Handles `afterLogin` action: generates ETH-account and requests its balance.
     */
    afterLogin: {
      root: true,
      handler(context, passphrase) {
        const account = utils.getAccountFromPassphrase(passphrase, api)
        context.commit('account', account)
        context.dispatch('updateStatus')

        // restore pending transaction
        const pendingTransaction = PendingTxStore.get(context.state.crypto)
        if (pendingTransaction) {
          context.commit('transactions', [pendingTransaction])
          context.dispatch('getTransaction', {
            hash: pendingTransaction.hash,
            force: true
          })
        }

        onInit(context)
      }
    },

    /** Resets module state */
    reset: {
      root: true,
      handler(context) {
        context.commit('reset')
      }
    },

    /** Handles store rehydratation: generates an account if one is not ready yet */
    rehydrate: {
      root: true,
      handler(context) {
        const passphrase = context.rootGetters.getPassPhrase
        const address = context.state.address

        if (!address && passphrase) {
          const account = utils.getAccountFromPassphrase(passphrase, api)
          context.commit('account', account)
          onInit(context)
        }

        context.dispatch('updateStatus')
      }
    },

    async sendTokens(context, { amount, admAddress, address, comments, increaseFee, replyToId }) {
      address = address.trim()
      const crypto = context.state.crypto

      // 1. Check nodes availability
      if (admAddress) {
        await adm.assertAnyNodeOnline()
      }
      await api.assertAnyNodeOnline()

      // 2. Invalidate previous pending transaction if finalized
      await invalidatePendingTransaction(context.state.crypto, (hashLocal) =>
        api.isTransactionFinalized(hashLocal)
      )

      // 3. Ensure there is no pending transaction
      const nonce = await api.getNonce(context.state.address)
      await assertNoPendingTransaction(context.state.crypto, nonce)

      // 4. Sign transaction offline
      const unsignedTransaction = await initTransaction(
        api,
        context,
        address,
        amount,
        nonce,
        increaseFee
      )
      const signedTransaction = await signTransaction(
        TransactionFactory.fromTxData(unsignedTransaction),
        context.state.privateKey
      )

      // 5. Send crypto transfer message to ADM blockchain (if ADM address provided)
      if (admAddress) {
        const msgPayload = {
          address: admAddress,
          amount,
          comments,
          crypto,
          hash: signedTransaction.transactionHash,
          replyToId
        }
        // Send a rich ADM message to indicate that we're performing an ETH transfer
        const success = await context.dispatch('sendCryptoTransferMessage', msgPayload, {
          root: true
        })
        if (!success) {
          throw new Error('adm_message')
        }
      }

      // 6. Save pending transaction
      const pendingTransaction = createPendingTransaction({
        hash: signedTransaction.transactionHash,
        senderId: context.state.address,
        recipientId: address,
        amount,
        fee: utils.calculateFee(unsignedTransaction.gasLimit, unsignedTransaction.gasPrice),
        nonce: Number(unsignedTransaction.nonce) // convert BigInt to Number
      })
      await PendingTxStore.save(context.state.crypto, pendingTransaction)
      context.commit('transactions', [pendingTransaction])

      // 7. Send signed transaction to ETH blockchain
      try {
        /**
         * @type {import('web3-types').TransactionReceipt}
         */
        const sentTransactionHash = await api.sendSignedTransaction(
          signedTransaction.rawTransaction
        )

        if (sentTransactionHash !== signedTransaction.transactionHash) {
          console.warn(
            `Something wrong with sent ETH tx, computed hash and sent tx differs: ${signedTransaction.transactionHash} and ${sentTransactionHash}`
          )
        }

        context.commit('transactions', [
          {
            hash: sentTransactionHash,
            senderId: unsignedTransaction.from,
            recipientId: address,
            amount,
            fee: undefined,
            status: 'PENDING',
            gasPrice: undefined
          }
        ])
        context.dispatch('getTransaction', {
          hash: sentTransactionHash,
          isNew: true,
          direction: 'from',
          force: true
        })

        return sentTransactionHash
      } catch (err) {
        context.commit('transactions', [
          { hash: signedTransaction.transactionHash, status: 'REJECTED' }
        ])
        PendingTxStore.remove(context.state.crypto)
        throw err
      }
    },

    /**
     * Retrieves block info: timestamp.
     * @param {any} context Vuex action context
     * @param {{ attempt: Number, blockNumber: Number, hash: String }} payload action payload
     */
    getBlock(context, payload) {
      const transaction = context.state.transactions[payload.hash]
      if (!transaction) return

      void api
        .useClient((client) => client.getBlock(payload.blockNumber))
        .then((block) => {
          // Converting from BigInt into Number must be safe
          const timestamp = BigNumber(block.timestamp.toString()).multipliedBy(1000).toNumber()

          context.commit('transactions', [
            {
              hash: transaction.hash,
              timestamp
            }
          ])
        })
    },

    /**
     * Enqueues a background request to retrieve the transaction details
     * @param {object} context Vuex action context
     * @param {{hash: string, force: boolean, timestamp: number, amount: number, direction: 'from' | 'to'}} payload hash and timestamp of the transaction to fetch
     */
    getTransaction(context, payload) {
      const existing = context.state.transactions[payload.hash]
      if (existing && !payload.force) return

      if (!existing || payload.dropStatus) {
        payload.updateOnly = false
        context.commit('transactions', [
          {
            hash: payload.hash,
            timestamp: (existing && existing.timestamp) || payload.timestamp || Date.now(),
            amount: payload.amount,
            status: 'PENDING',
            direction: payload.direction
          }
        ])
      }

      const attempt = payload.attempt || 0
      const retryCount = tf.getPendingTxRetryCount(
        payload.timestamp || existing?.timestamp,
        context.state.crypto
      )
      const retry = attempt < retryCount
      const retryTimeout = tf.getPendingTxRetryTimeout(
        payload.timestamp || existing?.timestamp,
        context.state.crypto
      )

      void api
        .useClient((client) => client.getTransaction(payload.hash))
        .then((tx) => {
          const isFinalized = tx.blockNumber !== undefined

          if (tx?.input && isFinalized) {
            const transaction = parseTransaction(context, tx)
            const status = existing ? existing.status : 'REGISTERED'
            if (transaction) {
              context.commit('transactions', [
                {
                  ...transaction,
                  status
                }
              ])
              // Fetch receipt details: status and actual gas consumption
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { attempt, ...receiptPayload } = payload
              context.dispatch('getTransactionReceipt', receiptPayload)
              // Now we know that the transaction has been registered by the ETH network.
              // Nothing else to do here, let's proceed to checking its status (see getTransactionReceipt)
              return
            }
          }

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
        .catch((err) => {
          if (retry && err instanceof TransactionNotFound) {
            const newPayload = {
              ...payload,
              attempt: attempt + 1,
              force: true,
              updateOnly: false,
              dropStatus: false
            }

            setTimeout(() => context.dispatch('getTransaction', newPayload), retryTimeout)

            return
          }

          throw err
        })
    },

    /**
     * Retrieves transaction receipt info: status and actual gas consumption.
     * @param {any} context Vuex action context
     * @param {{ hash: String, isNew: Boolean}} payload action payload
     */
    getTransactionReceipt(context, payload) {
      const transaction = context.state.transactions[payload.hash]
      if (!transaction) return

      const gasPrice = transaction.gasPrice

      const attempt = payload.attempt || 0
      const retryCount = tf.getPendingTxRetryCount(
        transaction.timestamp || Date.now(),
        context.state.crypto
      )
      const retry = attempt < retryCount
      const retryTimeout = tf.getPendingTxRetryTimeout(
        transaction.timestamp || Date.now(),
        context.state.crypto
      )

      void api
        .useClient((client) => client.getTransactionReceipt(payload.hash))
        .then((tx) => {
          let replay = true

          if (tx) {
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
              update.blockNumber = Number(tx.blockNumber)
            }

            context.commit('transactions', [update])

            if (tx.blockNumber) {
              context.dispatch('getBlock', {
                ...payload,
                blockNumber: Number(tx.blockNumber)
              })
            }

            // Re-fetch tx details if it's status is still unknown
            replay = !update.status
          }

          if (replay && retry) {
            // In case of an error or a pending transaction fetch its receipt once again later
            // Increment attempt counter, if no transaction was found so far
            const newPayload = { ...payload, attempt: 1 + (payload.attempt || 0) }
            setTimeout(() => context.dispatch('getTransactionReceipt', newPayload), retryTimeout)
          }
        })
        .catch((err) => {
          if (retry && err instanceof TransactionNotFound) {
            const newPayload = { ...payload, attempt: 1 + (payload.attempt || 0) }
            setTimeout(() => context.dispatch('getTransactionReceipt', newPayload), retryTimeout)

            return
          }

          throw err
        })
    },

    /**
     * Updates the transaction details
     * @param {{ dispatch: function }} param0 Vuex context
     * @param {{hash: string}} payload action payload
     */
    updateTransaction({ dispatch }, payload) {
      return dispatch('getTransaction', {
        ...payload,
        force: payload.force,
        updateOnly: payload.updateOnly
      })
    },

    getNewTransactions(context) {
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

      return ethIndexer
        .getTransactions(options)
        .then((transactions) => {
          context.commit('areRecentLoading', false)
          context.commit('transactions', { transactions, updateTimestamps: true })
        })
        .catch((err) => {
          context.commit('areRecentLoading', false)
          return Promise.reject(err)
        })
    },

    getOldTransactions(context) {
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

      return ethIndexer
        .getTransactions(options)
        .then((transactions) => {
          context.commit('areOlderLoading', false)
          context.commit('transactions', { transactions, updateTimestamps: true })

          if (transactions.length === 0) {
            context.commit('bottom', true)
          }
        })
        .catch((err) => {
          context.commit('areOlderLoading', false)
          return Promise.reject(err)
        })
    }
  }
}
