import Vue from 'vue'

export default {
  /** Resets module state */
  delegate_info (state, payload) {
    Vue.set(state.delegates, payload.address, payload)
  },
  clean_delegates (state) {
    state.delegates = {}
  },
  update_delegate (state, payload) {
    for (let key in payload.params) {
      Vue.set(state.delegates[payload.address], key, payload.params[key])
    }
  },
  set_last_transaction_status (state, payload) {
    state.lastTransactionConfirmed = payload
  }
}
