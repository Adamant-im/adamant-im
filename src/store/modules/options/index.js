import { Cryptos } from '@/lib/constants'

const state = () => ({
  logoutOnTabClose: true, // if true, localStorage will be cleared after logout
  sendMessageOnEnter: true,
  allowSoundNotifications: true,
  allowTabNotifications: true,
  allowPushNotifications: false,
  darkTheme: false,
  formatMessages: true,
  currentWallet: Cryptos.ADM // current Wallet Tab on Account view (this is not an option)
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
