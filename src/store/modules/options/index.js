import { Cryptos } from '@/lib/constants'

const state = () => ({
  stayLoggedIn: false, // if true, messages and passphase will be stored encrypted. If false, localStorage will be cleared after logout
  sendMessageOnEnter: true,
  allowSoundNotifications: true,
  allowTabNotifications: true,
  allowPushNotifications: false,
  darkTheme: true,
  formatMessages: true,
  currentWallet: Cryptos.ADM, // current Wallet Tab on Account view (this is not an option)
  useSocketConnection: true
})

const getters = {
  isLoginViaPassword: state => state.stayLoggedIn
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
