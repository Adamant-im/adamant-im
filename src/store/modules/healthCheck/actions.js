const config = require('../../../config.json')
const HealthChecker = require('../../../lib/healthCheck').default

const checkers = {}

export default {
  init (context) {
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        Object.keys(config.server).forEach(key => {
          context.commit('setServerList', {
            key,
            list: config.server[key].map(obj => ({ ...obj, online: true }))
          })

          checkers[key] = new HealthChecker({
            requester: window.ep.$http,
            urls: config.server[key],
            onStatusChange: list => context.commit('setServerList', {key, list})
          })
        })

        if (window.ep.$store.state.healthCheck) {
          // Start health checking
          context.dispatch('start')
        }

        // Watch for the option changes
        window.ep.$store.subscribe(mutation => {
          if (mutation.type === 'change_health_check') {
            if (mutation.payload) {
              context.dispatch('start')
            } else {
              context.dispatch('stop')
            }
          }
        })

        resolve(true)
      }, 0)
    })
  },

  start (context) {
    for (let key in checkers) {
      checkers[key].start()
    }
  },

  stop (context) {
    for (let key in checkers) {
      checkers[key].stop()
    }
  }
}
