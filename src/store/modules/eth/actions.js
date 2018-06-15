import Mnemonic from 'bitcore-mnemonic'
import hdkey from 'hdkey'
import Web3 from 'web3'

import getEndpointUrl from '../../../lib/getEndpointUrl'

const HD_KEY_PATH = "m/44'/60'/3'/1/0"
const TRANSFER_GAS = '21000'

const endpoint = getEndpointUrl('ETH')
const api = new Web3(new Web3.providers.HttpProvider(endpoint))

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

export default {
  /**
   * Handles `login` action: generates ETH-account and requests its balance.
   */
  login: {
    root: true,
    handler (context, passphrase) {
      const account = getAccountFromPassphrase(passphrase)
      context.commit('account', account)
      context.dispatch('updateStatus')
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
    }
  },

  /**
   * Requests ETH account status: balance, gas price, etc.
   * @param {*} context Vuex action context
   */
  updateStatus (context) {
    const batch = new api.eth.BatchRequest()

    // Balance
    batch.add(api.eth.getBalance.request(context.state.address, 'latest', (err, balance) => {
      if (err) {
        console.error('Failed to get ETH balance', err)
      } else {
        context.commit('balance', toEther(balance))
      }
    }))

    // Gas price
    batch.add(api.eth.getGasPrice.request((err, price) => {
      if (err) {
        console.error('Failed to get ETH gas price', err)
      } else {
        context.commit('gasPrice', {
          gasPrice: price,
          fee: toEther(Number(TRANSFER_GAS) * price)
        })
      }
    }))

    batch.execute()
  },

  /**
   * Sends tokens to the specified ETH address.
   *
   * @param {*} context Vuex action context
   * @param {string|number} amount amount to send
   * @param {string} receiver receiver ETH-address
   * @returns {Promise<string>} ETH transaction hash
   */
  sendTokens (context, { amount, receiver }) {
    const transaction = {
      from: context.state.address,
      to: receiver,
      value: toWei(amount),
      gas: TRANSFER_GAS,
      gasPrice: context.state.gasPrice || api.utils.toWei('20', 'Gwei')
    }

    if (!api.utils.isAddress(receiver)) {
      return Promise.reject(new Error('invalid_address'))
    }

    return api.eth.accounts.signTransaction(transaction, context.state.privateKey)
      .then(signed => {
        const tx = signed.rawTransaction
        const hash = api.utils.sha3(tx)
        console.log('ETH transaction', hash)

        const sendResult = api.eth.sendSignedTransaction(tx)
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
          senderId: transaction.from,
          recipientId: transaction.to,
          amount,
          fee: toEther(Number(transaction.gas) * transaction.gasPrice),
          status: 'PENDING',
          timestamp: Date.now(),
          confirmations: 0
        })

        return hash
      })
  }
}
