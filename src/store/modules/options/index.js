const state = () => ({
  logoutOnTabClose: true, // if true, localStorage will be cleared after logout
  sendMessageOnEnter: false,
  allowSoundNotifications: false,
  allowTabNotifications: false,
  allowPushNotifications: false,
  darkTheme: false
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
