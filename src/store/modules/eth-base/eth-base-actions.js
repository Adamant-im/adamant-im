import BigNumber from 'bignumber.js'

import * as utils from '../../../lib/eth-utils'
import adm from '../../../lib/nodes/adm'
import ethIndexer from '../../../lib/nodes/eth-indexer'
import {
  assertNoPendingTransaction,
  invalidatePendingTransaction,
  createPendingTransaction,
  PendingTxStore
} from '../../../lib/pending-transactions'
import { signTransaction, TransactionFactory } from 'web3-eth-accounts'
import api from '@/lib/nodes/eth'
import EthContract from 'web3-eth-contract'
import { isErc20 } from '@/lib/constants'
import Erc20 from '../erc20/erc20.abi.json'
import { logger } from '@/utils/devTools/logger'

/** Interval between attempts to fetch the registered tx details */
const CHUNK_SIZE = 25

/**
 * Hard cap on pages fetched by a single `getNewTransactions` run. Guards against
 * a stale or misbehaving indexer turning the catch-up loop into a request storm.
 * Anything left over is picked up by the next refresh tick.
 */
const MAX_NEW_TX_PAGES = 20

/**
 * Hard cap on pages of one single-block-timestamp group. Reaching it means the
 * group could not be proven complete, and the history boundary is then left
 * below the group instead of stepping over an unread remainder.
 */
const MAX_TIMESTAMP_GROUP_PAGES = 40

/**
 * Reads every transaction with the exact block timestamp `time`.
 *
 * `time` is a block timestamp and is not unique, so a group sharing it may be
 * larger than one chunk and cannot be walked with a `time` cursor at all. The
 * group is paged by `offset` over a deterministic `(time, txhash)` order — every
 * request stays bounded — until a short page proves the group is exhausted.
 *
 * @returns `true` when the whole group has been read
 */
const readTimestampGroup = async (context, { address, contract, decimals, time }) => {
  for (let page = 0; page < MAX_TIMESTAMP_GROUP_PAGES; page++) {
    const transactions = await ethIndexer.getTimestampGroup({
      address,
      contract,
      time,
      limit: CHUNK_SIZE,
      offset: page * CHUNK_SIZE,
      decimals
    })

    if (!transactions) return false

    if (transactions.length > 0) {
      // Every record shares `time`, so the boundaries are not affected here:
      // they are advanced by the caller once the group is known to be complete
      context.commit('transactions', transactions)
    }

    if (transactions.length < CHUNK_SIZE) return true
  }

  return false
}

/**
 * First update for an address: there is no boundary yet, so take the newest chunk.
 */
const fetchNewestTransactions = async (context, { address, contract, decimals }) => {
  const transactions = await ethIndexer.getTransactions({
    address,
    contract,
    from: 0,
    // Every history request must be bounded (see issue #975)
    limit: CHUNK_SIZE,
    order: 'time.desc',
    decimals
  })

  if (!transactions || transactions.length === 0) return

  context.commit('transactions', { transactions, updateTimestamps: true })

  const times = transactions.map((tx) => tx.time ?? 0)
  const newestTime = Math.max(...times)

  // A full chunk confined to a single timestamp may have been truncated, and the
  // boundary now points exactly at that timestamp: read the rest of the group so
  // that the next update does not step over its unread part
  if (transactions.length === CHUNK_SIZE && Math.min(...times) === newestTime) {
    await readTimestampGroup(context, { address, contract, decimals, time: newestTime })
  }
}

/**
 * Pages forward through the transactions newer than the known boundary.
 *
 * Ordering is ascending, so every page is the oldest unread chunk and nothing
 * between the boundary and the newest transaction can be skipped (the way ADM
 * does it). `maxHeight` is advanced explicitly and only up to a timestamp proven
 * to be fully read, so a run cut short by the page cap resumes exactly where it
 * stopped instead of jumping over the unread part of a timestamp group.
 */
const catchUpNewTransactions = async (context, { address, contract, decimals, maxHeight }) => {
  let from = maxHeight + 1
  let readUpTo = maxHeight

  for (let page = 0; page < MAX_NEW_TX_PAGES; page++) {
    const transactions = await ethIndexer.getTransactions({
      address,
      contract,
      from,
      // Every history request must be bounded (see issue #975)
      limit: CHUNK_SIZE,
      order: 'time.asc',
      decimals
    })

    if (!transactions || transactions.length === 0) break

    context.commit('transactions', transactions)

    const times = transactions.map((tx) => tx.time ?? 0)
    const newestTime = Math.max(...times)
    const oldestTime = Math.min(...times)

    // The response does not respect the requested boundary: a stale or
    // incompatible node, nothing to page through here
    if (newestTime < from) break

    // A short page means everything at or above `from` has been returned
    if (transactions.length < CHUNK_SIZE) {
      readUpTo = newestTime
      break
    }

    if (oldestTime === newestTime) {
      // The chunk is confined to one block timestamp: `time` cannot separate read
      // from unread, so the group is resolved explicitly. While it is unresolved
      // the boundary has to stay below it
      const complete = await readTimestampGroup(context, {
        address,
        contract,
        decimals,
        time: newestTime
      })

      if (!complete) break

      readUpTo = newestTime
      from = newestTime + 1
      continue
    }

    // Never repeat a request: the cursor has to move forward
    if (newestTime <= from) break

    // Ascending order guarantees every record below `newestTime` is in this page,
    // while the `newestTime` group itself may be truncated: it is read again
    readUpTo = newestTime - 1
    from = newestTime
  }

  if (readUpTo > maxHeight) {
    context.commit('setMaxHeight', readUpTo)
  }
}

export default function createActions(config) {
  const { onInit = () => {}, initTransaction, createSpecificActions } = config

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
          logger.log(
            'eth-base-actions',
            'warn',
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
        .useClient((client) => client().getBlock(payload.blockNumber))
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

    async getNewTransactions(context) {
      // Magic here helps to refresh Tx list when browser deletes it
      if (Object.keys(context.state.transactions).length < context.state.transactionsCount) {
        context.state.transactionsCount = 0
        context.state.maxHeight = -1
        context.state.minHeight = Infinity
        context.commit('bottom', false)
      }
      const { address, maxHeight, contractAddress, decimals } = context.state
      const options = { address, contract: contractAddress, decimals }

      context.commit('areRecentLoading', true)

      // A descending page above the boundary would return the newest CHUNK_SIZE
      // records and advance the boundary past everything in between, dropping
      // those transactions for good, so the catch-up runs in ascending order
      if (maxHeight > 0) {
        await catchUpNewTransactions(context, { ...options, maxHeight })
      } else {
        await fetchNewestTransactions(context, options)
      }

      context.commit('areRecentLoading', false)
    },

    async getOldTransactions(context) {
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

      const transactions = await ethIndexer.getTransactions(options)

      if (transactions) {
        context.commit('transactions', { transactions, updateTimestamps: true })

        if (transactions.length === 0) {
          context.commit('bottom', true)
        }
      }

      context.commit('areOlderLoading', false)
    },

    /**
     * Estimate gas limit for ETH or ERC20 transaction
     * @param {Object} context - Vuex context
     * @param {Object} params - Parameters
     * @param {number} params.amount - Transaction amount
     * @param {string} params.address - Recipient address
     * @returns {Promise<number|null>} Estimated gas limit or null if estimation failed
     */
    estimateGasLimit: {
      async handler({ state }, { amount, address }) {
        try {
          const isToken = isErc20(state.crypto)
          const toAddress = isToken ? state.contractAddress : address
          const value = isToken ? '0x0' : utils.toWei(amount)
          const data = isToken
            ? new EthContract(Erc20, state.contractAddress).methods
                .transfer(address, utils.toWhole(amount, state.decimals))
                .encodeABI()
            : undefined

          const transaction = {
            from: state.address,
            to: toAddress,
            value,
            ...(data && { data })
          }

          const gasLimit = await api.useClient((client) => client().estimateGas(transaction))
          return Number(gasLimit)
        } catch (error) {
          logger.log('eth-base-actions', 'warn', `${state.crypto} EstimateGas failed:`, error)
          return null
        }
      }
    }
  }
}
