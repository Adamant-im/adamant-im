export default {
  setServerList (state, key, list) {
    if (!state.domain[key]) {
      state.domain[key] = {}
    }
    state.domain[key].serverList = list
  }
}
