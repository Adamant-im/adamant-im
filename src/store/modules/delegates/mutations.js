import Vue from 'vue'

/** Resets module state */
export default {
  delegate_info (state, payload) {
    Vue.set(state.delegates, payload.address, payload)
  },
  reset (state) {
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
