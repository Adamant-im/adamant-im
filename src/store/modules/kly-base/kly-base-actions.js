import { BigNumber } from '@/lib/bignumber'
import { KlayrAccount, KLY_TXS_PER_PAGE } from '../../../lib/klayr'
import { getKlayrTimestamp } from '../../../lib/klayr/klayr-utils'
import adm from '../../../lib/nodes/adm'
import {
  assertNoPendingTransaction,
  createPendingTransaction,
  invalidatePendingTransaction,
  PendingTxStore
} from '../../../lib/pending-transactions'
import { storeCryptoAddress } from '../../../lib/store-crypto-address'
import { kly } from '../../../lib/nodes/kly'
import klyIndexer from '../../../lib/nodes/kly-indexer'

const DEFAULT_CUSTOM_ACTIONS = () => ({})

/**
 * @typedef {Object} Options
 * @property {function(KlyBaseApi, object): Promise} getNewTransactions function to get the new transactions list (second arg is a Vuex context)
 * @property {function(KlyBaseApi, object): Promise} getOldTransactions function to get the old transactions list (second arg is a Vuex context)
 * @property {function(function(): KlyBaseApi): object} customActions function to create custom actions for the current crypto (optional)
 * @property {number} fetchRetryTimeout interval (ms) between attempts to fetch the registered transaction details
 */

/**
 * Creates actions for the KLY-based crypto
 * @param {Options} options config options
 */
function createActions(options) {
  const { customActions = DEFAULT_CUSTOM_ACTIONS } = options

  /** @type {KlayrAccount | null} */
  let account = null

  return {
    afterLogin: {
      root: true,
      handler(context, passphrase) {
        account = new KlayrAccount(passphrase)

        context.commit('address', account.getKlayr32Address())
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
          account = new KlayrAccount(passphrase)

          context.commit('address', account.getKlayr32Address())
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

      // 1. Check nodes availability
      if (admAddress) {
        await adm.assertAnyNodeOnline()
      }
      await kly.assertAnyNodeOnline()

      // 2. Invalidate previous pending transaction if finalized
      await invalidatePendingTransaction(context.state.crypto, (hashLocal) =>
        klyIndexer.isTransactionFinalized(hashLocal, context.state.address)
      )

      // 3. Ensure there is no pending transaction
      await context.dispatch('updateStatus') // fetch the most recent nonce
      const nonce = context.state.nonce
      await assertNoPendingTransaction(context.state.crypto, nonce)

      // 4. Sign transaction offline
      const signedTransaction = await account.createTransaction(
        address,
        amount,
        fee,
        nonce,
        textData
      )

      // 5. Send crypto transfer message to ADM blockchain (if ADM address provided)
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
        const success = await context.dispatch('sendCryptoTransferMessage', msgPayload, {
          root: true
        })
        if (!success) {
          throw new Error('adm_message')
        }
      }

      // 6. Save pending transaction
      const pendingTransaction = createPendingTransaction({
        hash: signedTransaction.id,
        senderId: context.state.address,
        recipientId: address,
        amount,
        fee,
        nonce // convert BigInt to Number
      })
      await PendingTxStore.save(context.state.crypto, pendingTransaction)
      context.commit('transactions', [pendingTransaction])

      // 7. Send signed transaction to KLY blockchain
      try {
        const hash = await kly.sendTransaction(signedTransaction.hex, dryRun)

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

        return hash
      } catch (err) {
        context.commit('transactions', [{ hash: signedTransaction.id, status: 'REJECTED' }])
        PendingTxStore.remove(context.state.crypto)
        throw err
      }
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

      // eslint-disable-next-line no-useless-catch
      try {
        const timestamp = state.maxTimestamp
          ? `${getKlayrTimestamp(state.maxTimestamp)}:`
          : undefined

        const transactions = await klyIndexer.getTransactions({
          address: state.address,
          // First time we fetch txs — get newest first
          sort: state.maxTimestamp > 0 ? 'timestamp:asc' : 'timestamp:desc',
          timestamp,
          limit: KLY_TXS_PER_PAGE
        })
        commit('areRecentLoading', false)

        if (transactions.length > 0) {
          commit('transactions', { transactions, updateTimestamps: true })

          if (timestamp && transactions.length === KLY_TXS_PER_PAGE) {
            dispatch(`${state.crypto.toLowerCase()}/getNewTransactions`)
          }
        }
      } catch (err) {
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

      // eslint-disable-next-line no-useless-catch
      try {
        const timestamp =
          state.minTimestamp < Infinity ? `:${getKlayrTimestamp(state.minTimestamp)}` : undefined

        const transactions = await klyIndexer.getTransactions({
          address: state.address,
          sort: 'timestamp:desc',
          timestamp,
          limit: KLY_TXS_PER_PAGE
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
        throw err
      }
    },

    ...customActions(() => account)
  }
}

export default createActions
