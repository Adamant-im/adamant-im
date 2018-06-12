export default {
  init (context) {
    context.commit('init')
  },

  start (context) {
    context.state.checker.start()
  },

  stop (context) {
    context.state.checker.stop()
  }
}
