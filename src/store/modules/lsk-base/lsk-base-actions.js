import BigNumber from '@/lib/bignumber'
import LskBaseApi from '../../../lib/lisk/lsk-base-api'
import { storeCryptoAddress } from '../../../lib/store-crypto-address'
import * as tf from '../../../lib/transactionsFetching'

const DEFAULT_CUSTOM_ACTIONS = () => ({ })

/**
 * @typedef {Object} Options
 * @property {function} apiCtor class to use for interaction with the crypto API
 * @property {function(LskBaseApi, object): Promise} getNewTransactions function to get the new transactions list (second arg is a Vuex context)
 * @property {function(LskBaseApi, object): Promise} getOldTransactions function to get the old transactions list (second arg is a Vuex context)
 * @property {function(function(): LskBaseApi): object} customActions function to create custom actions for the current crypto (optional)
 * @property {number} fetchRetryTimeout interval (ms) between attempts to fetch the registered transaction details
 */

/**
  * Creates actions for the LSK-based crypto
  * @param {Options} options config options
  */
function createActions (options) {
  const Api = options.apiCtor || LskBaseApi
  const {
    customActions = DEFAULT_CUSTOM_ACTIONS,
    fetchRetryTimeout
  } = options

  /** @type {LskBaseApi} */
  let api = null

  return {
    afterLogin: {
      root: true,
      handler (context, passphrase) {
        api = new Api(passphrase)
        context.commit('address', api.address)
        context.dispatch('updateStatus')
        context.dispatch('storeAddress')
      }
    },

    /** Resets module state */
    reset: {
      root: true,
      handler (context) {
        api = null
        context.commit('reset')
      }
    },

    /** Handles store rehydratation: generates an account if one is not ready yet */
    rehydrate: {
      root: true,
      handler (context) {
        const passphrase = context.rootGetters.getPassPhrase
        if (passphrase) {
          api = new Api(passphrase)
          context.commit('address', api.address)
          context.dispatch('updateStatus')
          context.dispatch('storeAddress')
        }
      }
    },

    updateBalance: {
      root: true,
      handler (context) {
        context.dispatch('updateStatus')
      }
    },

    storeAddress ({ state }) {
      storeCryptoAddress(state.crypto, state.address)
    },

    updateStatus (context) {
      if (!api) return
      api.getBalance().then(balance => context.commit('status', { balance }))
    },

    sendTokens (context, { amount, admAddress, address, comments, fee, increaseFee, textData }) {
      if (!api) return
      address = address.trim()

      const crypto = context.state.crypto

      return api.createTransaction(address, amount, fee, context.state.nonce, textData)
        .then(tx => {
          if (!admAddress) return tx.hex

          const msgPayload = {
            address: admAddress,
            amount: BigNumber(amount).toFixed(),
            comments,
            crypto,
            hash: tx.txid
          }

          // Send a special message to indicate that we're performing a crypto transfer
          return context.dispatch('sendCryptoTransferMessage', msgPayload, { root: true })
            .then(success => success ? tx.hex : Promise.reject(new Error('adm_message')))
        })
        .then(rawTx => api.sendTransaction(rawTx).then(
          hash => ({ hash }),
          error => ({ error })
        ))
        .then(({ hash, error }) => {
          if (error) {
            context.commit('transactions', [{ hash, status: 'REJECTED' }])
            throw error
          } else {
            console.log(`${crypto} transaction has been sent: ${hash}`)

            context.commit('transactions', [{
              hash,
              senderId: context.state.address,
              recipientId: address,
              amount,
              fee,
              status: 'PENDING',
              timestamp: Date.now(),
              data: textData
            }])

            context.dispatch('getTransaction', { hash, force: true })

            return hash
          }
        })
    },

    /**
     * Calculates fee for a Tx
     * @param {object} context Vuex action context
     * @
     */
    calculateFee (context, payload) {
      if (!api) return
      return api.getFee(payload.address, payload.amount, payload.nonce, payload.data)
    },

    /**
     * Retrieves transaction details
     * @param {object} context Vuex action context
     * @param {{hash: string, force: boolean, timestamp: number, amount: number}} payload hash and timestamp of the transaction to fetch
     */
    async getTransaction (context, payload) {
      if (!api) return
      if (!payload.hash) return

      let existing = context.state.transactions[payload.hash]
      if (existing && !payload.force) return

      // Set a stub so far, if the transaction is not in the store yet
      if (!existing || payload.dropStatus) {
        payload.updateOnly = false
        context.commit('transactions', [{
          hash: payload.hash,
          timestamp: (existing && existing.timestamp) || payload.timestamp || Date.now(),
          amount: payload.amount,
          status: 'PENDING'
        }])
        existing = context.state.transactions[payload.hash]
      }

      let tx = null
      try {
        tx = await api.getTransaction(payload.hash)
      } catch (e) { }

      let retry = false
      let retryTimeout = 0
      const attempt = payload.attempt || 0

      if (tx) {
        context.commit('transactions', [tx])
        // The transaction has been confirmed, we're done here
        if (tx.status === 'CONFIRMED') return

        // If it's not confirmed but is already registered, keep on trying to fetch its details
        retryTimeout = fetchRetryTimeout
        retry = true
      } else if (existing && existing.status === 'REGISTERED') {
        // We've failed to fetch the details for some reason, but the transaction is known to be
        // accepted by the network - keep on fetching
        retryTimeout = fetchRetryTimeout
        retry = true
      } else {
        // The network does not yet know this transaction. We'll make several attempts to retrieve it.
        retry = attempt < tf.getPendingTxRetryCount(payload.timestamp || (existing && existing.timestamp), context.state.crypto)
        retryTimeout = tf.getPendingTxRetryTimeout(payload.timestamp || (existing && existing.timestamp), context.state.crypto)
      }

      if (!retry) {
        // If we're here, we have abandoned any hope to get the transaction details.
        context.commit('transactions', [{ hash: payload.hash, status: 'REJECTED' }])
      } else if (!payload.updateOnly) {
        // Try to get the details one more time
        const newPayload = {
          ...payload,
          attempt: attempt + 1,
          force: true,
          updateOnly: false,
          dropStatus: false
        }
        setTimeout(() => context.dispatch('getTransaction', newPayload), retryTimeout)
      }
    },

    /**
     * Updates the transaction details
     * @param {{ dispatch: function }} param0 Vuex context
     * @param {{hash: string}} payload action payload
     */
    updateTransaction ({ dispatch }, payload) {
      return dispatch('getTransaction', { ...payload, force: payload.force, updateOnly: payload.updateOnly })
    },

    /**
     * Retrieves new transactions: those that follow the most recently retrieved one.
     * @param {any} context Vuex action context
     */
    async getNewTransactions (context) {
      if (!api) return
      const options = { }
      // Magic here helps to refresh Tx list when browser deletes it
      if (Object.keys(context.state.transactions).length < context.state.transactionsCount) {
        context.state.transactionsCount = 0
        context.state.maxTimestamp = -1
        context.state.minTimestamp = Infinity
        context.commit('bottom', false)
      }
      if (context.state.maxTimestamp > 0) {
        options.fromTimestamp = context.state.maxTimestamp
        options.sort = 'timestamp:asc'
      } else {
        // First time we fetch txs — get newest
        options.sort = 'timestamp:desc'
      }

      context.commit('areRecentLoading', true)
      return api.getTransactions(options).then(
        transactions => {
          context.commit('areRecentLoading', false)
          if (transactions && transactions.length > 0) {
            context.commit('transactions', { transactions, updateTimestamps: true })
            // get new transactions until we fetch the newest one
            if (options.fromTimestamp && transactions.length === api.TX_CHUNK_SIZE) {
              this.dispatch(`${context.state.crypto.toLowerCase()}/getNewTransactions`)
            }
          }
        },
        error => {
          context.commit('areRecentLoading', false)
          return Promise.reject(error)
        }
      )
    },

    /**
     * Retrieves old transactions: those that preceded the oldest among the retrieved ones.
     * @param {any} context Vuex action context
     */
    async getOldTransactions (context) {
      if (!api) return
      // If we already have the most old transaction for this address, no need to request anything
      if (context.state.bottomReached) return Promise.resolve()

      const options = { }
      if (context.state.minTimestamp < Infinity) {
        options.toTimestamp = context.state.minTimestamp
      }
      options.sort = 'timestamp:desc'

      context.commit('areOlderLoading', true)

      return api.getTransactions(options).then(transactions => {
        context.commit('areOlderLoading', false)

        if (transactions && transactions.length > 0) {
          context.commit('transactions', { transactions, updateTimestamps: true })
        }

        // Successful but empty response means, that the oldest transaction for the current
        // address has been received already
        if (transactions && transactions.length === 0) {
          context.commit('bottom', true)
        }
      }, error => {
        context.commit('areOlderLoading', false)
        return Promise.reject(error)
      })
    },

    ...customActions(() => api)
  }
}

export default createActions
