export default {
  setServerList (state, payload) {
    // DEBUG
    console.log(state, payload)

    if (!state.domain[payload.key]) {
      state.domain[payload.key] = {}
    }
    state.domain[payload.key].serverList = payload.list
  }
}
