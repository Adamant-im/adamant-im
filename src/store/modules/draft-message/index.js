const state = () => ({
  drafts: {}
})

const mutations = {
  saveMessage(state, payload) {
    state.drafts[payload.partnerId] = payload.message
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
    return state.drafts[partnerId]
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
