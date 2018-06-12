export default {
  init (context) {
    window.setTimeout(() => {
      context.commit('initChecker', window.ep.$http)

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
    }, 0)
  },

  start (context) {
    context.state.checker.start()
  },

  stop (context) {
    context.state.checker.stop()
  }
}
