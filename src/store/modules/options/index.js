import { Cryptos, Rates } from '@/lib/constants'

const state = () => ({
  stayLoggedIn: false, // if true, messages and passphrase will be stored encrypted. If false, localStorage will be cleared after logout
  sendMessageOnEnter: true,
  allowSoundNotifications: true,
  allowTabNotifications: true,
  allowNotificationType: 0, // 0 - No Notifications, 1 - Background Fetch, 2 - Push
  darkTheme: true,
  formatMessages: true,
  useFullDate: false,
  currentWallet: Cryptos.ADM, // current Wallet Tab on Account view (this is not an option)
  sendFundsData: {
    wasSendingFunds: false,
    cryptoCurrency: 'ADM',
    recipientAddress: '',
    amountToSend: '', // amount to send from Home page
    amountFromChat: '', // amount to send from Chat page
    comment: '',
    increaseFee: false,
    increaseFeeChat: false
  }, // save state in case of returning to Home page (if was left from SendFunds)
  currentNodesTab: 'adm',
  useSocketConnection: true,
  suppressWarningOnAddressesNotification: false,
  currentRate: Rates.USD,
  scrollTopPosition: 0,
  accountLastRoute: '/home',
  accountScrollPositions: {},
  settingsLastRoute: '/options',
  settingsScrollPositions: {},
  forceTransactionsRefresh: false,
  devModeEnabled: false // Dev screens access
})

const getters = {
  isLoginViaPassword: (state) => state.stayLoggedIn,
  scrollTopPosition: (state) => state.scrollTopPosition,
  accountLastRoute: (state) => state.accountLastRoute,
  accountScrollPosition: (state) => (path) => state.accountScrollPositions[path] ?? 0,
  settingsLastRoute: (state) => state.settingsLastRoute,
  settingsScrollPosition: (state) => (path) => state.settingsScrollPositions[path] ?? 0,
  currentNodesTab: (state) => state.currentNodesTab,
  wasSendingFunds: (state) => state.sendFundsData.wasSendingFunds,
  savedCryptoCurrency: (state) => state.sendFundsData.cryptoCurrency,
  savedRecipientAddress: (state) => state.sendFundsData.recipientAddress,
  savedAmountToSend: (state) => state.sendFundsData.amountToSend,
  savedAmountFromChat: (state) => state.sendFundsData.amountFromChat,
  savedComment: (state) => state.sendFundsData.comment,
  savedIncreaseFee: (state) => state.sendFundsData.increaseFee,
  savedIncreaseFeeChat: (state) => state.sendFundsData.increaseFeeChat,
  isDevModeEnabled: (state) => state.devModeEnabled
}

const mutations = {
  updateOption(state, { key, value }) {
    if (key in state) {
      state[key] = value
    }
  },
  setAccountLastRoute(state, path) {
    state.accountLastRoute = path
  },
  setAccountScrollPosition(state, { path, top }) {
    state.accountScrollPositions = {
      ...state.accountScrollPositions,
      [path]: top
    }
  },
  resetAccountViewState(state) {
    state.accountLastRoute = '/home'
    state.accountScrollPositions = {}
  },
  setSettingsLastRoute(state, path) {
    state.settingsLastRoute = path
  },
  setSettingsScrollPosition(state, { path, top }) {
    state.settingsScrollPositions = {
      ...state.settingsScrollPositions,
      [path]: top
    }
  },
  resetSettingsViewState(state) {
    state.settingsLastRoute = '/options'
    state.settingsScrollPositions = {}
  }
}

export default {
  state,
  getters,
  mutations,
  namespaced: true
}
