import { SNACKBAR_TIMEOUT } from './constants'

const initialState = {
  show: false,
  message: '',
  timeout: SNACKBAR_TIMEOUT,
  color: '',
  variant: '',
  isError: false
}

const state = () => ({
  ...initialState // clone object
})

const mutations = {
  show(
    state,
    { message = '', timeout = SNACKBAR_TIMEOUT, color = '', variant = '', isError = false }
  ) {
    if (message) {
      state.message = message
      state.color = color
      state.timeout = timeout
      state.variant = variant
      state.isError = isError

      state.show = true
    }
  },
  changeState(state, value) {
    state.show = value
  },
  resetOptions(state) {
    state.message = initialState.message
    state.timeout = initialState.timeout
    state.color = initialState.color
    state.variant = initialState.variant
    state.isError = initialState.isError
  }
}

const actions = {
  show({ commit }, options) {
    commit('show', options)
  }
}

export default {
  state,
  mutations,
  actions,
  namespaced: true
}
