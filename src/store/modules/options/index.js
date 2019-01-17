const state = () => ({
  logoutOnTabClose: false, // if true, localStorage will be cleared after logout
  sendMessageOnEnter: false,
  allowSoundNotifications: false,
  allowTabNotifications: false,
  allowPushNotifications: false,
  darkTheme: false
})

const mutations = {
  updateOption (state, { key, value }) {
    if (key in state) {
      state[key] = value
    }
  }
}

export default {
  state,
  mutations,
  namespaced: true
}
