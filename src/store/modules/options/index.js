import { Cryptos, Rates } from '@/lib/constants'

const state = () => ({
  stayLoggedIn: false, // if true, messages and passphrase will be stored encrypted. If false, localStorage will be cleared after logout
  sendMessageOnEnter: true,
  allowSoundNotifications: true,
  allowTabNotifications: true,
  // allowPushNotifications: false,
  isAllowNotifications: true,
  allowNotificationType: 2,
  darkTheme: true,
  formatMessages: true,
  useFullDate: false,
  currentWallet: Cryptos.ADM, // current Wallet Tab on Account view (this is not an option)
  useSocketConnection: true,
  suppressWarningOnAddressesNotification: false,
  currentRate: Rates.USD
})

const getters = {
  isLoginViaPassword: (state) => state.stayLoggedIn
}

const mutations = {
  updateOption(state, { key, value }) {
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
