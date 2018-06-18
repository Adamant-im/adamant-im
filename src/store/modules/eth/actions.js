import Mnemonic from 'bitcore-mnemonic'
import hdkey from 'hdkey'
import Web3 from 'web3'

import getEndpointUrl from '../../../lib/getEndpointUrl'
import * as admApi from '../../../lib/adamant-api'

import { Fees } from '../../../lib/constants'

const HD_KEY_PATH = "m/44'/60'/3'/1/0"
const TRANSFER_GAS = '21000'
const KVS_ADDRESS = 'eth:address'
const DEFAULT_GAS_PRICE = '20000000000' // 20 Gwei

const endpoint = getEndpointUrl('ETH')
const api = new Web3(new Web3.providers.HttpProvider(endpoint, 2000))

/** Background requests queue */
const backgroundRequests = []
/** Background requests timer */
let backgroundTimer = null

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
  const mnemonic = new Mnemonic(passphrase, Mnemonic.Words.ENGLISH)
  const seed = mnemonic.toSeed()
  const privateKey = hdkey.fromMasterSeed(seed).derive(HD_KEY_PATH)._privateKey

  return api.eth.accounts.privateKeyToAccount('0x' + privateKey.toString('hex'))
}

function toEther (wei) {
  return api.utils.fromWei(`${wei}`, 'ether')
}

function toWei (ether) {
  return api.utils.toWei(`${ether}`, 'ether')
}

function enqueueRequest (key, requestSupplier) {
  if (backgroundRequests.some(x => x.key === key)) return

  let requests = requestSupplier()
  backgroundRequests.push({ key, requests: Array.isArray(requests) ? requests : [requests] })
}

function executeRequests () {
  const requests = backgroundRequests.splice(0, 20)
  if (!requests.length) return

  const batch = new api.eth.BatchRequest()
  requests.forEach(x => x.requests.forEach(r => batch.add(r)))

  batch.execute()
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

      // Store ETH address into the KVS if it's not there yet and user has
      // enough ADM for this transaction
      if (context.rootState.balance >= Fees.KVS) {
        admApi.getStored(KVS_ADDRESS).then(address => {
          if (!address) admApi.storeValue(KVS_ADDRESS, account.address)
        })
      }

      clearInterval(backgroundTimer)
      backgroundTimer = setInterval(executeRequests, 1000)
    }
  },

  /** Resets module state */
  reset: {
    root: true,
    handler (context) {
      clearInterval(backgroundTimer)
      context.commit('reset')
    }
  },

  /** Handles store rehydratation: generates an account if one is not ready yet */
  rehydrate: {
    root: true,
    handler (context) {
      const passphrase = context.rootState.passPhrase
      const address = context.state.address

      if (!address && passphrase) {
        const account = getAccountFromPassphrase(passphrase)
        context.commit('account', account)
      }

      context.dispatch('updateStatus')

      clearInterval(backgroundTimer)
      backgroundTimer = setInterval(executeRequests, 1000)
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

      const block = context.state.blockNumber ? Math.max(0, context.state.blockNumber - 8) : 0

      return [
        // Balance
        api.eth.getBalance.request(context.state.address, block || 'latest', (err, balance) => {
          if (!err) context.commit('balance', toEther(balance))
        }),
        // Current gas price
        api.eth.getGasPrice.request((err, price) => {
          if (!err) {
            context.commit('gasPrice', {
              gasPrice: price,
              fee: toEther(Number(TRANSFER_GAS) * price)
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
        enqueueRequest('status', supplier)
        lastStatusUpdate = Date.now()
        context.dispatch('updateStatus')
      }
    }, delay)
  },

  /** Updates current nonce based on the transactions count */
  updateNonce ({ state, commit }) {
    if (state.nonce) return Promise.resolve(state.nonce)
    return api.eth.getTransactionCount(state.address, 'latest').then(count => {
      commit('nonce', count)
      return state.nonce
    })
  },

  /**
   * Sends tokens to the specified ETH address.
   *
   * @param {*} context Vuex action context
   * @param {string|number} amount amount to send
   * @param {string} receiver receiver ETH-address
   * @returns {Promise<string>} ETH transaction hash
   */
  sendTokens (context, { amount, admAddress, ethAddress }) {
    const ethTx = {
      from: context.state.address,
      to: ethAddress,
      value: toWei(amount),
      gas: TRANSFER_GAS,
      gasPrice: Math.round(1.5 * context.state.gasPrice) || DEFAULT_GAS_PRICE
    }

    if (!api.utils.isAddress(ethAddress)) {
      return Promise.reject({ code: 'invalid_address' })
    }

    return context.dispatch('updateNonce')
      .then(() => { if (context.state.nonce) ethTx.nonce = context.state.nonce })
      .then(() => api.eth.accounts.signTransaction(ethTx, context.state.privateKey))
      .then(signed => {
        const tx = signed.rawTransaction
        const hash = api.utils.sha3(tx)
        console.log('ETH transaction', hash)

        const result = { hash, tx }

        if (!admAddress) return result

        // Send a special message to indicate that we're performing an ETH transfer
        return admApi.sendSpecialMessage(admAddress, { type: 'eth_transaction', amount, hash })
          .then(() => {
            console.log('ADM message has been sent')
            return result
          })
          .catch((error) => {
            console.log('Failed to send "eth_transaction"', error)
            return Promise.reject({ code: 'adm_message' })
          })
      })
      .then(({ tx, hash }) => {
        // https://github.com/ethereum/web3.js/issues/1255#issuecomment-356492134
        const method = api.eth.sendSignedTransaction.method
        const payload = method.toPayload([tx])

        return new Promise((resolve) => {
          method.requestManager.send(payload, error => resolve({ hash, error }))
        })
      })
      .then(({ hash, error }) => {
        if (error) {
          console.error('Failed to send ETH transaction', error)
          context.commit('setTransaction', { hash, status: 'ERROR' })
          throw error
        } else {
          console.log('ETH transaction has been sent')

          context.commit('nonce', ethTx.nonce + 1)
          const timestamp = Date.now()

          context.commit('setTransaction', {
            hash,
            senderId: ethTx.from,
            recipientId: ethTx.to,
            amount,
            fee: toEther(Number(ethTx.gas) * ethTx.gasPrice),
            status: 'PENDING',
            timestamp,
            confirmations: 0
          })

          context.dispatch('getTransaction', { hash, timestamp, isNew: true })

          return hash
        }
      })
  },

  /**
   * Enqueues a background request to retrieve the transaction details
   * @param {object} context Vuex action context
   * @param {{hash: string, timestamp: number}} payload hash and timestamp of the transaction to fetch
   */
  getTransaction (context, payload) {
    const existing = context.state.transactions[payload.hash]
    if (existing && existing.status !== 'PENDING') return

    const key = 'transaction:' + payload.hash
    const supplier = () => api.eth.getTransaction.request(payload.hash, (err, tx) => {
      if (!err && tx) {
        const transaction = {
          hash: tx.hash,
          senderId: tx.from,
          recipientId: tx.to,
          amount: toEther(tx.value),
          fee: toEther(Number(tx.gas) * tx.gasPrice),
          status: tx.blockNumber ? 'SUCCESS' : 'PENDING',
          timestamp: payload.timestamp, // TODO: fetch from block?
          confirmations: tx.blockNumber ? (context.state.blockNumber - tx.blockNumber) : 0
        }

        context.commit('setTransaction', transaction)
      }

      // In case of an error or a pending transaction fetch its details once again later
      if (err || (tx && !tx.blockNumber) || (!tx && payload.isNew)) {
        context.dispatch('getTransaction', payload)
      }
    })

    enqueueRequest(key, supplier)
  }
}
