export default {
  init (context) {
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        context.commit('initCheckers', window.ep.$http)

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
    for (let key in context.state) {
      context.state[key].checker.start()
    }
  },

  stop (context) {
    for (let key in context.state) {
      context.state[key].checker.stop()
    }
  }
}
