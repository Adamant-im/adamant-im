const initialState = {
  show: false,
  options: {
    message: '',
    timeout: 1500,
    color: ''
  }
}

const state = () => ({
  ...initialState // clone object
})

const mutations = {
  show (state, { message = '', timeout = 1500, color = '' }) {
    if (message) {
      state.message = message
      state.color = color
      state.timeout = timeout

      state.show = true
    }
  },
  changeState (state, value) {
    state.show = value
  },
  resetOptions (state) {
    state.options = {
      ...initialState.options
    }
  }
}

const actions = {
  show ({ commit }, options) {
    commit('show', options)
    commit('resetOptions')
  }
}

export default {
  state,
  mutations,
  actions,
  namespaced: true
}
