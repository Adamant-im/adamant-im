export default {
  useFastest(state, value) {
    state.useFastest = value
  },

  toggle(state, payload) {
    const node = state[payload.type][payload.url]
    if (node) {
      node.active = payload.active
    }
  },

  status(state, { status, nodeType }) {
    state[nodeType][status.url] = status
  }
}
