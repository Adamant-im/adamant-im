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
const api = new Web3(new Web3.providers.HttpProvider(endpoint))

const backgroundRequests = []
let backgroundTimer = null

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
  backgroundRequests.push({ key, request: requestSupplier() })
}

function executeRequests () {
  const requests = backgroundRequests.splice(0, 20)
  if (!requests.length) return

  const batch = new api.eth.BatchRequest()
  requests.forEach(x => batch.add(x.request))

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
      setInterval(executeRequests, 5000)
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

      clearInterval(backgroundTimer)
      setInterval(executeRequests, 5000)
    }
  },

  /**
   * Requests ETH account status: balance, gas price, etc.
   * @param {*} context Vuex action context
   */
  updateStatus (context) {
    enqueueRequest('balance', () => api.eth.getBalance.request(context.state.address, 'latest', (err, balance) => {
      if (err) {
        console.error('Failed to get ETH balance', err)
      } else {
        context.commit('balance', toEther(balance))
      }

      context.dispatch('updateStatus')
    }))

    enqueueRequest('gasPrice', () => api.eth.getGasPrice.request((err, price) => {
      if (err) {
        console.error('Failed to get ETH gas price', err)
      } else {
        context.commit('gasPrice', {
          gasPrice: price,
          fee: toEther(Number(TRANSFER_GAS) * price)
        })
      }
    }))
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
      gasPrice: context.state.gasPrice || DEFAULT_GAS_PRICE
    }

    if (!api.utils.isAddress(ethAddress)) {
      return Promise.reject({ code: 'invalid_address' })
    }

    return api.eth.accounts.signTransaction(ethTx, context.state.privateKey)
      .then(signed => {
        const tx = signed.rawTransaction
        const hash = api.utils.sha3(tx)
        console.log('ETH transaction', hash)

        const result = { hash, tx }

        if (!admAddress) {
          return result
        } else {
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
        }
      })
      .then(({ tx, hash }) => {
        const sendResult = api.eth.sendSignedTransaction(tx)
        console.log('ETH transaction has been sent')

        sendResult.once('confirmation', (number, receipt) => {
          console.log('ETH receipt ', receipt)
          context.commit('transactionConfirmation', { hash, number, receipt })
        })
        sendResult.on('error', error => {
          console.error('ETH error', error)
          context.commit('transactionError', hash)
        })

        // TODO: not used so far, subject for future changes
        context.commit('addTransaction', {
          hash,
          senderId: ethTx.from,
          recipientId: ethTx.to,
          amount,
          fee: toEther(Number(ethTx.gas) * ethTx.gasPrice),
          status: 'PENDING',
          timestamp: Date.now(),
          confirmations: 0
        })

        return hash
      })
  }
}
