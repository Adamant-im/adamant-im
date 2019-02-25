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
  },
  upVote (state, delegateId) {
    const delegate = state.delegates[delegateId]

    if (delegate) {
      Vue.set(delegate, 'upvoted', true)
      Vue.set(delegate, 'downvoted', false)
      Vue.set(delegate, '_voted', true)
    }
  },
  downVote (state, delegateId) {
    const delegate = state.delegates[delegateId]

    if (delegate) {
      Vue.set(delegate, 'upvoted', false)
      Vue.set(delegate, 'downvoted', true)
      Vue.set(delegate, '_voted', false)
    }
  }
}
