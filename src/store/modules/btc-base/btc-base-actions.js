import BigNumber from '@/lib/bignumber'
import BtcBaseApi from '../../../lib/bitcoin/btc-base-api'
import { storeCryptoAddress } from '../../../lib/store-crypto-address'
import * as tf from '../../../lib/transactionsFetching'

const DEFAULT_CUSTOM_ACTIONS = () => ({ })

/**
 * @typedef {Object} Options
 * @property {function} apiCtor class to use for interaction with the crypto API
 * @property {function(BtcBaseApi, object): Promise} getNewTransactions function to get the new transactions list (second arg is a Vuex context)
 * @property {function(BtcBaseApi, object): Promise} getOldTransactions function to get the old transactions list (second arg is a Vuex context)
 * @property {function(function(): BtcBaseApi): object} customActions function to create custom actions for the current crypto (optional)
 * @property {number} fetchRetryTimeout interval (ms) between attempts to fetch the registered transaction details
 */

/**
  * Creates actions for the BTC-based crypto
  * @param {Options} options config options
  */
function createActions (options) {
  const Api = options.apiCtor || BtcBaseApi
  const {
    getNewTransactions,
    getOldTransactions,
    customActions = DEFAULT_CUSTOM_ACTIONS,
    fetchRetryTimeout
  } = options

  /** @type {BtcBaseApi} */
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

    sendTokens (context, { amount, admAddress, address, comments, fee }) {
      if (!api) return
      address = address.trim()

      const crypto = context.state.crypto

      return api.createTransaction(address, amount, fee)
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
              timestamp: Date.now()
            }])

            context.dispatch('getTransaction', { hash, force: true })

            return hash
          }
        })
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
        retryTimeout = tf.getRegisteredTxRetryTimeout(tx.timestamp || existing.timestamp || payload.timestamp, context.state.crypto, fetchRetryTimeout, tx.instantsend)
        retry = true
      } else if (existing && existing.status === 'REGISTERED') {
        // We've failed to fetch the details for some reason, but the transaction is known to be
        // accepted by the network - keep on fetching
        retryTimeout = tf.getRegisteredTxRetryTimeout(existing.timestamp || payload.timestamp, context.state.crypto, fetchRetryTimeout, existing.instantsend)
        retry = true
      } else {
        // The network does not yet know this transaction. We'll make several attempts to retrieve it.
        retry = attempt < tf.getPendingTxRetryCount(existing.timestamp || payload.timestamp, context.state.crypto)
        retryTimeout = tf.getPendingTxRetryTimeout(existing.timestamp || payload.timestamp, context.state.crypto)
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

    getNewTransactions (context) {
      if (api && typeof getNewTransactions === 'function') {
        return getNewTransactions(api, context)
      }
      return Promise.resolve()
    },

    getOldTransactions (context) {
      if (api && typeof getOldTransactions === 'function') {
        return getOldTransactions(api, context)
      }
      return Promise.resolve()
    },

    ...customActions(() => api)
  }
}

export default createActions
