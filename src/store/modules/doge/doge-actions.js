import DogeApi from '../../../lib/doge-api'
import * as admApi from '../../../lib/adamant-api'

/** @type {DogeApi} */
let api = null

const STATUS_UPDATE_INTERVAL = 10 * 1000 // 10s

export default {
  afterLogin: {
    root: true,
    handler (context, passphrase) {
      api = new DogeApi(passphrase)
      context.commit('address', api.address)
      context.dispatch('updateStatus')
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
      }
    }
  },

  updateStatus (context) {
    if (!api) return

    const lastUpdate = context.state.lastStatusUpdate
    if (lastUpdate && Date.now() - lastUpdate < STATUS_UPDATE_INTERVAL) return

    api.getBalance().then(balance => context.commit('status', { balance }))

    setTimeout(() => {
      if (context.state.address) {
        context.dispatch('updateStatus')
      }
    }, STATUS_UPDATE_INTERVAL)
  },

  sendTokens (context, { amount, admAddress, address, comments }) {
    address = address.trim()

    return api.createTransaction(address, amount)
      .then(tx => {
        if (!admAddress) return tx.hex

        // Send a special message to indicate that we're performing an ETH transfer
        const type = 'doge_transaction'
        const msg = { type, amount, hash: tx.txid, comments }
        return admApi.sendSpecialMessage(admAddress, msg)
          .then(response => {
            if (response.success) {
              console.log('ADM message has been sent', msg)
              return tx.hex
            } else {
              console.log(`Failed to send "${type}"`, response)
              return Promise.reject(new Error('adm_message'))
            }
          })
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
          console.log(`${crypto} transaction has been sent`)

          context.commit('transactions', [{
            hash,
            senderId: context.state.address,
            recipientId: address,
            amount,
            // fee: 0,
            status: 'PENDING',
            timestamp: Date.now()
          }])

          context.dispatch('getTransaction', { hash, isNew: true })

          return hash
        }
      })
  }
}
