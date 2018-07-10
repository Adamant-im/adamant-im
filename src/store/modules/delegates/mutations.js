import Vue from 'vue'

// import { resetState } from '../../../lib/reset-state'
// import initialState from './state'

export default {
  /** Resets module state */
  // reset (state) {
  //   resetState(state, initialState)
  // },
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
