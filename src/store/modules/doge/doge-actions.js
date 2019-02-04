import DogeApi, { TX_FEE } from '../../../lib/doge-api'
import { Cryptos } from '../../../lib/constants'
import { storeCryptoAddress } from '../../../lib/store-crypto-address'

const MAX_ATTEMPTS = 60

/** @type {DogeApi} */
let api = null

export default {
  afterLogin: {
    root: true,
    handler (context, passphrase) {
      api = new DogeApi(passphrase)
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
        api = new DogeApi(passphrase)
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
    storeCryptoAddress(Cryptos.DOGE, state.address)
  },

  updateStatus (context) {
    if (!api) return
    api.getBalance().then(balance => context.commit('status', { balance }))
  },

  sendTokens (context, { amount, admAddress, address, comments }) {
    if (!api) return
    address = address.trim()

    return api.createTransaction(address, amount)
      .then(tx => {
        if (!admAddress) return tx.hex
        const crypto = 'doge'
        // Send a special message to indicate that we're performing an ETH transfer
        const msgPayload = {
          address: admAddress,
          amount,
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
          console.error(`Failed to send DOGE transaction`, error)
          context.commit('transactions', [{ hash, status: 'ERROR' }])
          throw error
        } else {
          context.commit('transactions', [{
            hash,
            senderId: context.state.address,
            recipientId: address,
            amount,
            fee: TX_FEE,
            status: 'PENDING',
            timestamp: Date.now()
          }])

          context.dispatch('getTransaction', { hash, isNew: true })

          return hash
        }
      })
  },

  /**
   * Retrieves transaction details
   * @param {object} context Vuex action context
   * @param {{hash: string, force: boolean, timestamp: number, amount: number}} payload hash and timestamp of the transaction to fetch
   */
  getTransaction (context, payload) {
    if (!api) return

    const existing = context.state.transactions[payload.hash]
    if (existing && existing.status !== 'PENDING' && !payload.force) return

    // Set a stub so far
    if (!existing || existing.status === 'ERROR') {
      context.commit('transactions', [{
        hash: payload.hash,
        timestamp: payload.timestamp,
        amount: payload.amount,
        status: 'PENDING'
      }])
    }

    api.getTransaction(payload.hash)
      .then(
        tx => {
          if (tx) context.commit('transactions', [tx])
          return (!tx && payload.isNew) || (tx && tx.status !== 'SUCCESS')
        },
        () => true
      )
      .then(replay => {
        const attempt = payload.attempt || 0
        if (replay && attempt < MAX_ATTEMPTS) {
          const newPayload = { ...payload, attempt: attempt + 1 }
          setTimeout(() => context.dispatch('getTransaction', newPayload), 3000)
        }
      })
  },

  getNewTransactions (context) {
    if (!api) return

    return api.getTransactions().then(result => {
      context.commit('transactions', result.items)
    })
  },

  getOldTransactions (context) {
    if (!api) return

    const from = Object.keys(context.state.transactions).length
    return api.getTransactions(from).then(result => {
      context.commit('transactions', result.items)
      if (!result.hasMore) {
        context.commit('bottom')
      }
    })
  }
}
