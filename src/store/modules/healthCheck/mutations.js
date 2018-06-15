import Vue from 'vue'

export default {
  setServerList (state, payload) {
    // DEBUG
    console.log(state, payload)

    Vue.set(state, payload.key, payload.list)
  }
}
