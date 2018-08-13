import Web3 from 'web3'

import getEndpointUrl from '../../../lib/getEndpointUrl'
import * as admApi from '../../../lib/adamant-api'
import * as ethUtils from '../../../lib/eth-utils'
import Erc20 from './erc20.abi.json'

const TRANSFER_GAS = '210000'

const endpoint = getEndpointUrl('ETH')
const api = new Web3(new Web3.providers.HttpProvider(endpoint, 2000))

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
    }
  },

  /** Resets module state */
  reset: {
    root: true,
    handler (context) {
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
    }
  },

  /** Updates crypto balance info */
  updateStatus (context) {
    const contract = new api.eth.Contract(Erc20, context.state.contractAddress)
    contract.methods.balanceOf(context.state.address).call().then(
      balance => context.commit('balance', balance),
      error => console.warn(`${crypto} balance failed: `, error)
    )
  },

  sendTokens (context, { amount, admAddress, ethAddress, comments }) {
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
          console.error('Failed to send ETH transaction', error)
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
  }
}
