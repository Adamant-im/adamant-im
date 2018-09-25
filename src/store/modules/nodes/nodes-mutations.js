export default {
  useFastest (state, value) {
    state.useFastest = value
  },

  toggle (state, payload) {
    const { url, active } = payload
    const index = state.list.findIndex(x => x.url === url)

    if (index >= 0) {
      state.list[index] = {
        ...state.list[index],
        active: active
      }
    }
  },

  status (state, status) {
    const index = state.list.findIndex(x => x.url === status.url)
    if (index >= 0) {
      state.list[index] = status
    } else {
      state.list.push(status)
    }
  }
}
