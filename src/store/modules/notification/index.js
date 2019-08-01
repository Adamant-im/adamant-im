const actions = {}

const getters = {}

const mutations = {
  /**
   * Increase activation button click count of desktop notification
   * @param {object} state State
   */
  increaseDesktopAcivateClickCount (state) {
    state.desktopAcivateClickCount++
  }
}

const state = {
  desktopAcivateClickCount: 0
}

export default {
  actions,
  getters,
  mutations,
  namespaced: true,
  state
}
