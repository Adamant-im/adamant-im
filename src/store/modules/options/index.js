const state = () => ({
  logoutOnTabClose: false, // if true, localStorage will be cleared after logout
  sendMessageOnEnter: false,
  allowSoundNotifications: false,
  allowBrowserTabNotification: false
})

const mutations = {
  updateOption (state, { key, value }) {
    const keyExists = Object.keys(state)
      .find(findKey => findKey === key)

    if (keyExists) {
      state[key] = value
    }
  }
}

export default {
  state,
  mutations,
  namespaced: true
}
