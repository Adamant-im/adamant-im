import Vue from 'vue'

export default {
  /* payload - object:
      key - 'adm', 'eth'
      list - [{ip, protocol, port, online}]
  */
  setServerList (state, payload) {
    if (!state[payload.key]) {
      Vue.set(state, payload.key, {})
    }

    Vue.set(state[payload.key], 'serverList', payload.list)
  }
}
