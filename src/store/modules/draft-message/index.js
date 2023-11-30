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
  deleteAllSaveMessage(state) {
    state.drafts = {}
  }
}
const getters = {
  draftMessage: (state) => (partnerId) => {
    const objMessage = state.drafts[partnerId]
    if (objMessage === undefined) {
      return ''
    } else {
      return objMessage.message
    }
  },

  draftReplyTold: (state) => (partnerId) => {
    const objMessage = state.drafts[partnerId]
    if (objMessage === undefined) {
      return ''
    } else {
      return objMessage.replyToId
    }
  }
}

const actions = {
  resetState(context) {
    context.commit('deleteAllSaveMessage')
  }
}
export default {
  state,
  mutations,
  getters,
  actions,
  namespaced: true
}
