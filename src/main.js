// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import VueI18n from 'vue-i18n'
import VueResource from 'vue-resource'
import VueClipboards from 'vue-clipboards'
import Vuex from 'vuex'
import VueMaterial from 'vue-material'
import VueHazeServerApi from './lib/adamantServerApi'
import storeData from './lib/lsStore.js'
import 'vue-material/dist/vue-material.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

Vue.use(Vuex)
Vue.use(VueMaterial)
Vue.use(VueResource)
Vue.use(VueClipboards)
Vue.use(VueI18n)
Vue.use(VueHazeServerApi)

Vue.config.productionTip = false

var messages = require('./i18n').default

Vue.material.registerTheme({
  default: {
    primary: {
      color: 'light-green',
      hue: 700
    },
    accent: 'red'
  },
  teal: {
    primary: 'blue',
    accent: 'pink'
  },
  purple: {
    primary: 'purple',
    accent: 'orange'
  }
})

function deviceIsDisabled () {
  try {
    if (/iP(hone|od|ad)/.test(navigator.platform)) {
      // supports iOS 2.0 and later: <http://bit.ly/TJjs1V>
      var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/)
      if (parseInt(v[1], 10) < 8) {
        return true
      }
    }
    if (/BlackBerry/.test(navigator.platform)) {
      return true
    }
  } catch (e) {
  }
  return false
}

const store = new Vuex.Store({
  state: {
    address: '',
    language: 'en',
    passPhrase: '',
    connectionString: '',
    balance: 0,
    disabled: deviceIsDisabled(),
    is_new_account: false,
    ajaxIsOngoing: false,
    firstChatLoad: true,
    lastErrorMsg: '',
    transactions: {},
    showPanel: false,
    trackNewMessages: false,
    notifySound: true,
    notifyBar: true,
    notifyDesktop: false,
    showBottom: true,
    partnerName: '',
    partnerDisplayName: '',
    partners: {},
    newChats: {},
    totalNewChats: 0,
    chats: {},
    lastChatHeight: 0,
    currentChat: false,
    storeInLocalStorage: false
  },
  actions: {
    add_chat_i18n_message ({commit}, payload) {
      payload.message = window.ep.$i18n.t(payload.message)
      commit('add_chat_message', payload)
    }
  },
  mutations: {
    force_update (state) {
    },
    change_notify_sound (state, payload) {
      state.notifySound = payload
    },
    change_notify_bar (state, payload) {
      state.notifyBar = payload
    },
    change_notify_desktop (state, payload) {
      state.notifyDesktop = payload
    },
    change_lang (state, payload) {
      state.language = payload
    },
    change_storage_method (state, payload) {
      state.storeInLocalStorage = payload
    },
    save_passphrase (state, payload) {
      state.passPhrase = payload.passPhrase
    },
    ajax_start (state) {
      state.ajaxIsOngoing = true
    },
    ajax_end (state) {
      state.ajaxIsOngoing = false
    },
    ajax_end_with_error (state) {
      state.ajaxIsOngoing = false
      state.lastErrorMsg = 'CONNECT PROBLEM'
    },
    send_error (state, payload) {
      state.lastErrorMsg = payload.msg
    },
    logout (state) {
      state.passPhrase = ''
      state.address = ''
      state.balance = 0
      state.is_new_account = false
      state.showPanel = false
      state.showBottom = true
      state.transactions = {}
      state.chats = {}
      state.newChats = {}
      state.totalNewChats = 0
      state.currentChat = false
      state.trackNewMessages = false
      state.firstChatLoad = true
      state.lastChatHeight = 0
      state.partnerDisplayName = ''
      window.publicKey = false
      window.privateKey = false
      window.secretKey = false
      state.publicKey = false
      state.privateKey = false
      state.secretKey = false
//      state.partners = {}
    },
    stop_tracking_new (state) {
      state.trackNewMessages = false
    },
    start_tracking_new (state) {
      state.trackNewMessages = true
    },
    mark_as_read_total (state, payload) {
      if (state.newChats[payload]) {
        var newTotal = parseInt(state.totalNewChats) - parseInt(state.newChats[payload])
        state.totalNewChats = newTotal
        if (state.totalNewChats < 0) {
          state.totalNewChats = 0
        }
      }
    },
    mark_as_read (state, payload) {
      if (state.newChats[payload]) {
        // var wasNew = parseInt(state.newChats[payload])
        Vue.set(state.newChats, payload, 0)
        // var newTotal = parseInt(state.newChats['total']) - wasNew
        // Vue.set(state.newChats, 'total', newTotal)
      }
    },
    login (state, payload) {
      state.address = payload.address
      if (payload.passPhrase) {
        state.passPhrase = payload.passPhrase
      }
      state.balance = payload.balance
      if (payload.is_new_account) {
        state.is_new_account = payload.is_new_account
      }
    },
    change_partner_name (state, payload) {
      if (state.partnerName) {
        state.partners[state.partnerName] = payload
        state.partnerDisplayName = payload
      }
    },
    transaction_info (state, payload) {
      Vue.set(state.transactions, payload.id, payload)
    },
    connect (state, payload) {
      state.connectionString = payload.string
    },
    select_chat (state, payload) {
      var body = document.getElementsByTagName('body')[0]
      body.style.width = '100%'
      body.style.height = '100%'
      body.style.position = 'fixed'
      state.currentChat = state.chats[payload]
      Vue.set(state.currentChat, messages, state.chats[payload].messages)
      state.partnerName = payload
      state.partnerDisplayName = ''
      if (state.partners[payload]) {
        state.partnerDisplayName = state.partners[payload]
      }
      state.showPanel = true
      state.showBottom = false
    },
    leave_chat (state, payload) {
      state.showPanel = false
      state.partnerName = ''
      state.partnerDisplayName = ''
      state.showBottom = true
      var body = document.getElementsByTagName('body')[0]
      body.style.width = 'auto'
      body.style.height = 'auto'
      body.style.position = 'relative'
    },
    have_loaded_chats (state) {
      state.firstChatLoad = false
    },
    create_chat (state, payload) {
      var partner = payload
      var currentDialogs = state.chats[partner]
      if (!currentDialogs) {
        currentDialogs = {
          partner: partner,
          messages: {},
          last_message: {}
        }
      }
      Vue.set(state.chats, partner, currentDialogs)
    },
    add_chat_message (state, payload) {
      state.firstChatLoad = false
      var me = state.address
      var partner = ''
      var direction = 'from'
      if (payload.recipientId === me) {
        direction = 'to'
        partner = payload.senderId
      } else {
        partner = payload.recipientId
      }
      if (direction === 'to' && state.trackNewMessages && state.partnerName !== partner) {
        if (state.newChats[partner]) {
          Vue.set(state.newChats, partner, state.newChats[partner] + 1)
        } else {
          Vue.set(state.newChats, partner, 1)
        }
        if (!state.totalNewChats) {
          state.totalNewChats = 0
        }
        state.totalNewChats = state.totalNewChats + 1
        if (state.notifySound) {
          try {
            window.audio.playSound('newMessageNotification')
            // document.getElementById('messageSound').play()
          } catch (e) {
          }
        }
      } else if (direction === 'to' && state.trackNewMessages && document.hidden) {
        if (state.notifySound) {
          try {
            window.audio.playSound('newMessageNotification')
          } catch (e) {
          }
        }
      }
      var currentDialogs = state.chats[partner]
      if (!currentDialogs) {
        currentDialogs = {
          partner: partner,
          messages: {},
          last_message: {}
        }
      }
      if (currentDialogs.last_message.timestamp < payload.timestamp || !currentDialogs.last_message.timestamp) {
        currentDialogs.last_message = {
          message: payload.message,
          timestamp: payload.timestamp
        }
      }
      payload.confirm_class = 'unconfirmed'
      if (payload.height) {
        payload.confirm_class = 'confirmed'
      }
      if (payload.height && payload.height > state.lastChatHeight) {
        state.lastChatHeight = payload.height
      }
      Vue.set(state.chats, partner, currentDialogs)
      payload.direction = direction
      Vue.set(state.chats[partner].messages, payload.id, payload)
    }
  },
  plugins: [storeData()]
})

var i18n = new VueI18n({
  locale: store.state.language, // set locale
  messages // set locale messages
})

/* eslint-disable no-new */
window.ep = new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App },
  i18n: i18n
})
