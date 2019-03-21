const state = () => ({
  logoutOnTabClose: true, // if true, localStorage will be cleared after logout
  sendMessageOnEnter: true,
  allowSoundNotifications: true,
  allowTabNotifications: true,
  allowPushNotifications: false,
  darkTheme: false,
  formatMessages: true
})

const getters = {
  isLoginViaPassword: state => !state.logoutOnTabClose
}

const mutations = {
  updateOption (state, { key, value }) {
    if (key in state) {
      state[key] = value
    }
  }
}

export default {
  state,
  getters,
  mutations,
  namespaced: true
}
