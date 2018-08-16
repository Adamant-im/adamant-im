import Web3 from 'web3'
import abiDecoder from 'abi-decoder'

import getEndpointUrl from '../../../lib/getEndpointUrl'
import * as admApi from '../../../lib/adamant-api'
import * as ethUtils from '../../../lib/eth-utils'
import Erc20 from './erc20.abi.json'

const TRANSFER_GAS = '210000'
/** Max number of attempts to retrieve the transaction details */
const MAX_ATTEMPTS = 150

const endpoint = getEndpointUrl('ETH')
const api = new Web3(new Web3.providers.HttpProvider(endpoint, 2000))
const queue = new ethUtils.BatchQueue(api.eth.BatchRequest)

/** Timestamp of the most recent status update */
let lastStatusUpdate = 0
/** Status update interval */
const STATUS_INTERVAL = 8000

/**
 * Creates ETH account for the specified passphrase.
 *
 * @param {string} passphrase 12-word passphrase
 * @returns {{address: string, privateKey: string, publicKey: string}} account
 */
function getAccountFromPassphrase (passphrase) {
  return api.eth.accounts.privateKeyToAccount(ethUtils.privateKeyFromPassphrase(passphrase))
}

export default {
  /**
   * Handles `afterLogin` action: generates ETH-account and requests its balance.
   */
  afterLogin: {
    root: true,
    handler (context, passphrase) {
      const account = getAccountFromPassphrase(passphrase)
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
        const account = getAccountFromPassphrase(passphrase)
        context.commit('account', account)
      }

      context.dispatch('updateStatus')

      queue.start()
    }
  },

  /** Updates crypto balance info */
  updateStatus (context) {
    if (!context.state.address) return

    const contract = new api.eth.Contract(Erc20, context.state.contractAddress)
    contract.methods.balanceOf(context.state.address).call()
      .then(
        balance => context.commit('balance', ethUtils.toFraction(balance, context.state.decimals)),
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
    const crypto = context.state.crypto
    const contract = new api.eth.Contract(Erc20, context.state.contractAddress)

    const ethTx = {
      from: context.state.address,
      to: context.state.contractAddress,
      value: '0x0',
      gasLimit: TRANSFER_GAS,
      gasPrice: context.getters.gasPrice,
      data: contract.methods.transfer(ethAddress, ethUtils.toWhole(amount, context.state.decimals)).encodeABI()
    }

    return api.eth.getTransactionCount(context.state.address, 'pending')
      .then(count => {
        if (count) ethTx.nonce = count
        return api.eth.accounts.signTransaction(ethTx, context.state.privateKey)
      })
      .then(signed => {
        const tx = signed.rawTransaction
        const hash = api.utils.sha3(tx)
        console.log(crypto + ' transaction', hash)

        return { tx, hash }
      })
      .then(signedTx => {
        if (!admAddress) return signedTx
        // Send a special message to indicate that we're performing an ETH transfer
        const type = crypto.toLowerCase() + '_transaction'
        const msg = { type, amount, hash: signedTx.hash, comments }
        return admApi.sendSpecialMessage(admAddress, msg)
          .then(() => {
            console.log('ADM message has been sent', msg)
            return signedTx
          })
          .catch((error) => {
            console.log(`Failed to send "${type}"`, error)
            return Promise.reject(new Error('adm_message'))
          })
      })
      .then(({ tx, hash }) => {
        // https://github.com/ethereum/web3.js/issues/1255#issuecomment-356492134
        const method = api.eth.sendSignedTransaction.method
        const payload = method.toPayload([tx])

        return new Promise((resolve) => {
          method.requestManager.send(payload, (error, result) => {
            console.log('sendSignedTransaction', { error, result })
            resolve({ hash: result, error })
          })
        })
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
            fee: ethUtils.toEther(Number(ethTx.gas) * ethTx.gasPrice),
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
            fee: ethUtils.toEther(Number(tx.gas) * tx.gasPrice),
            status: tx.blockNumber ? 'SUCCESS' : 'PENDING',
            timestamp: payload.timestamp, // TODO: fetch from block?
            blockNumber: tx.blockNumber,
            amount,
            recipientId
          }

          context.commit('transaction', transaction)
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
  }
}
