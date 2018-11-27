import DogeApi from '../../../lib/doge-api'

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
  }
}
