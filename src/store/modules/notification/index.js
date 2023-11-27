const actions = {}

const getters = {}

const mutations = {
  /**
   * Increase activation button click count of desktop notification
   * @param {object} state State
   */
  increaseDesktopActivateClickCount(state) {
    state.desktopActivateClickCount++
  }
}

const state = {
  desktopActivateClickCount: 0
}

export default {
  actions,
  getters,
  mutations,
  namespaced: true,
  state
}
