const state = () => ({
  drafts: {}
})

const mutations = {
  saveReplyToId(state, payload) {
    if (state.drafts[payload.partnerId]) {
      state.drafts[payload.partnerId].replyToId = payload.replyToId
    } else {
      state.drafts[payload.partnerId] = {
        replyToId: payload.replyToId
      }
    }
  },

  saveMessage(state, payload) {
    if (state.drafts[payload.partnerId]) {
      state.drafts[payload.partnerId].message = payload.message
    } else {
      state.drafts[payload.partnerId] = {
        message: payload.message
      }
    }
  },

  deleteMessage(state, partnerId) {
    state.drafts[partnerId] = ''
  },
  reset(state) {
    state.drafts = {}
  }
}
const getters = {
  draftMessage: (state) => (partnerId) => {
    const objMessage = state.drafts[partnerId]
    if (objMessage) {
      return objMessage.message
    } else {
      return ''
    }
  },

  draftReplyTold: (state) => (partnerId) => {
    const objMessage = state.drafts[partnerId]
    if (objMessage) {
      return objMessage.replyToId
    } else {
      return ''
    }
  }
}

const actions = {
  resetState(context) {
    context.commit('reset')
  }
}
export default {
  state,
  mutations,
  getters,
  actions,
  namespaced: true
}
