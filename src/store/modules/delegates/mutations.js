/** Resets module state */
export default {
  delegate_info(state, payload) {
    state.delegates[payload.address] = payload
  },
  reset(state) {
    state.delegates = {}
  },
  update_delegate(state, payload) {
    for (const key in payload.params) {
      const delegate = state.delegates[payload.address]
      delegate[key] = payload.params[key]
    }
  },
  set_last_transaction_status(state, payload) {
    state.lastTransactionConfirmed = payload
  },
  upVote(state, delegateId) {
    const delegate = state.delegates[delegateId]

    if (delegate) {
      delegate.upvoted = true
      delegate.downvoted = false
      delegate._voted = true
    }
  },
  downVote(state, delegateId) {
    const delegate = state.delegates[delegateId]

    if (delegate) {
      delegate.upvoted = false
      delegate.downvoted = true
      delegate._voted = false
    }
  }
}
