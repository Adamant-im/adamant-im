import BigNumber from '@/lib/bignumber'
import { LiskAccount, LSK_TXS_PER_PAGE } from '../../../lib/lisk'
import { getLiskTimestamp } from '../../../lib/lisk/lisk-utils'
import {
  assertNoPendingTransaction,
  createPendingTransaction,
  PendingTxStore
} from '../../../lib/pending-transactions'
import { storeCryptoAddress } from '../../../lib/store-crypto-address'
import * as tf from '../../../lib/transactionsFetching'
import { lsk } from '../../../lib/nodes/lsk'
import lskIndexer from '../../../lib/nodes/lsk-indexer'

const DEFAULT_CUSTOM_ACTIONS = () => ({})

/**
 * @typedef {Object} Options
 * @property {function(LskBaseApi, object): Promise} getNewTransactions function to get the new transactions list (second arg is a Vuex context)
 * @property {function(LskBaseApi, object): Promise} getOldTransactions function to get the old transactions list (second arg is a Vuex context)
 * @property {function(function(): LskBaseApi): object} customActions function to create custom actions for the current crypto (optional)
 * @property {number} fetchRetryTimeout interval (ms) between attempts to fetch the registered transaction details
 */

/**
 * Creates actions for the LSK-based crypto
 * @param {Options} options config options
 */
function createActions(options) {
  const { customActions = DEFAULT_CUSTOM_ACTIONS, fetchRetryTimeout } = options

  /** @type {LiskAccount | null} */
  let account = null

  return {
    afterLogin: {
      root: true,
      handler(context, passphrase) {
        account = new LiskAccount(passphrase)

        context.commit('address', account.getLisk32Address())
        context.dispatch('updateStatus')
        context.dispatch('storeAddress')

        // restore pending transaction
        const pendingTransaction = PendingTxStore.get(context.state.crypto)
        if (pendingTransaction) {
          context.commit('transactions', [pendingTransaction])
        }
      }
    },

    /** Resets module state */
    reset: {
      root: true,
      handler(context) {
        account = null
        context.commit('reset')
      }
    },

    /** Handles store rehydratation: generates an account if one is not ready yet */
    rehydrate: {
      root: true,
      handler(context) {
        const passphrase = context.rootGetters.getPassPhrase
        if (passphrase) {
          account = new LiskAccount(passphrase)

          context.commit('address', account.getLisk32Address())
          context.dispatch('updateStatus')
          context.dispatch('storeAddress')
        }
      }
    },

    storeAddress({ state }) {
      storeCryptoAddress(state.crypto, state.address)
    },

    async sendTokens(
      context,
      { amount, admAddress, address, comments, fee, textData, replyToId, dryRun }
    ) {
      if (!account) return
      address = address.trim()

      const crypto = context.state.crypto

      // 1. Sign transaction offline
      const signedTransaction = await account.createTransaction(
        address,
        amount,
        fee,
        context.state.nonce,
        textData
      )

      // 2. Ensure there is no pending transaction
      await assertNoPendingTransaction(
        context.state.crypto,
        (hashLocal) => lskIndexer.getTransaction(hashLocal, context.state.address),
        context.state.nonce
      )

      // 3. Send crypto transfer message to ADM blockchain (if ADM address provided)
      if (admAddress && !dryRun) {
        const msgPayload = {
          address: admAddress,
          amount: BigNumber(amount).toFixed(),
          comments,
          crypto,
          hash: signedTransaction.id,
          replyToId
        }

        // Send a special message to indicate that we're performing a crypto transfer
        const success = context.dispatch('sendCryptoTransferMessage', msgPayload, { root: true })
        if (!success) {
          throw new Error('adm_message')
        }
      }

      // 4. Save pending transaction
      const pendingTransaction = createPendingTransaction({
        hash: signedTransaction.id,
        senderId: context.state.address,
        recipientId: address,
        amount,
        fee: 0,
        timestamp: Date.now(),
        nonce: context.state.nonce // convert BigInt to Number
      })
      await PendingTxStore.save(context.state.crypto, pendingTransaction)
      context.commit('transactions', [pendingTransaction])

      // 5. Send signed transaction to ETH blockchain
      try {
        const hash = await lsk.sendTransaction(signedTransaction.hex, dryRun)

        console.log(`${crypto} transaction has been sent: ${hash}`)

        context.commit('transactions', [
          {
            hash,
            senderId: context.state.address,
            recipientId: address,
            amount,
            fee,
            status: 'PENDING',
            timestamp: Date.now(),
            data: textData
          }
        ])

        context.dispatch('getTransaction', { hash, force: true })

        return hash
      } catch (err) {
        context.commit('transactions', [{ hash: signedTransaction.id, status: 'REJECTED' }])
        throw err
      }
    },

    /**
     * Retrieves transaction details
     * @param {object} context Vuex action context
     * @param {{hash: string, force: boolean, timestamp: number, amount: number}} payload hash and timestamp of the transaction to fetch
     */
    async getTransaction(context, payload) {
      if (!payload.hash) return

      let existing = context.state.transactions[payload.hash]
      if (existing && !payload.force) return

      // Set a stub so far, if the transaction is not in the store yet
      if (!existing || payload.dropStatus) {
        payload.updateOnly = false
        context.commit('transactions', [
          {
            hash: payload.hash,
            timestamp: (existing && existing.timestamp) || payload.timestamp || Date.now(),
            amount: payload.amount,
            status: 'PENDING'
          }
        ])
        existing = context.state.transactions[payload.hash]
      }

      let tx = null
      try {
        tx = await lskIndexer.getTransaction(payload.hash, context.state.address)
      } catch (e) {
        /* empty */
      }

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
        retry =
          attempt <
          tf.getPendingTxRetryCount(
            payload.timestamp || (existing && existing.timestamp),
            context.state.crypto
          )
        retryTimeout = tf.getPendingTxRetryTimeout(
          payload.timestamp || (existing && existing.timestamp),
          context.state.crypto
        )
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
    updateTransaction({ dispatch }, payload) {
      return dispatch('getTransaction', {
        ...payload,
        force: payload.force,
        updateOnly: payload.updateOnly
      })
    },

    /**
     * Retrieves new transactions: those that follow the most recently retrieved one.
     * @param {any} context Vuex action context
     */
    async getNewTransactions({ state, commit, dispatch }) {
      // Magic here helps to refresh Tx list when browser deletes it
      if (Object.keys(state.transactions).length < state.transactionsCount) {
        state.transactionsCount = 0
        state.maxTimestamp = -1
        state.minTimestamp = Infinity
        commit('bottom', false)
      }

      commit('areRecentLoading', true)
      try {
        const timestamp = state.maxTimestamp
          ? `${getLiskTimestamp(state.maxTimestamp)}:`
          : undefined

        const transactions = await lskIndexer.getTransactions({
          address: state.address,
          // First time we fetch txs — get newest first
          sort: state.maxTimestamp > 0 ? 'timestamp:asc' : 'timestamp:desc',
          timestamp,
          limit: LSK_TXS_PER_PAGE
        })
        commit('areRecentLoading', false)

        if (transactions.length > 0) {
          commit('transactions', { transactions, updateTimestamps: true })

          if (timestamp && transactions.length === LSK_TXS_PER_PAGE) {
            dispatch(`${state.crypto.toLowerCase()}/getNewTransactions`)
          }
        }
      } catch (err) {
        commit('areRecentLoading', false)
        throw err
      }
    },

    /**
     * Retrieves old transactions: those that preceded the oldest among the retrieved ones.
     * @param {any} context Vuex action context
     */
    async getOldTransactions({ state, commit }) {
      // If we already have the most old transaction for this address, no need to request anything
      if (state.bottomReached) return

      commit('areOlderLoading', true)
      try {
        const timestamp =
          state.minTimestamp < Infinity ? `:${getLiskTimestamp(state.minTimestamp)}` : undefined

        const transactions = await lskIndexer.getTransactions({
          address: state.address,
          sort: 'timestamp:desc',
          timestamp,
          limit: LSK_TXS_PER_PAGE
        })
        commit('areOlderLoading', false)

        if (transactions.length > 0) {
          commit('transactions', { transactions, updateTimestamps: true })
        }

        // Successful but empty response means, that the oldest transaction for the current
        // address has been received already
        if (transactions.length === 0) {
          commit('bottom', true)
        }
      } catch (err) {
        commit('areOlderLoading', false)
        throw err
      }
    },

    ...customActions(() => account)
  }
}

export default createActions
