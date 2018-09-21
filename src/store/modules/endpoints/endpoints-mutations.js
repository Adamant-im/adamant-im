import Vue from 'vue'

export default {
  useFastest (state, value) {
    state.useFastest = value
  },

  toggle (state, payload) {
    const { url, disabled } = payload
    const index = state.endpoints.findIndex(x => x.url === url)
    
    if (index >= 0) {
      state.endpoints[index] = {
        ...state.endpoints[index],
        disabled: disabled
      }
    }
  },

  status (state, status) {
    const index = state.endpoints.findIndex(x => x.url === status.url)
    if (index >= 0) {
      state.endpoints[index] = status
    } else {
      state.endpoints.push(status)
    }
  }
}