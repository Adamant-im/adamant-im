
import Vue from 'vue'
import {Base64} from 'js-base64'

import storeData from '../lib/lsStore.js'

import ethModule from './modules/eth'
import partnersModule from './modules/partners'
import admModule from './modules/adm'

import delegatesModule from './modules/delegates'

import * as admApi from '../lib/adamant-api'
import {base64regex} from '../lib/constants'

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

var defaultLanguage = navigator.language || navigator.userLanguage
defaultLanguage = defaultLanguage.toLowerCase().substring(0, 2)
window.refreshTime = new Date().getTime()
if (defaultLanguage !== 'ru' && defaultLanguage !== 'en') {
  defaultLanguage = 'en'
}

function createMockMessage (state, newAccount, partner, message) {
  let currentDialogs = state.chats[partner]
  if (!currentDialogs) {
    currentDialogs = {
      partner: partner,
      readOnly: true,
      messages: {
        0: {
          message: window.ep.$i18n.t('chats.' + message),
          timestamp: 0,
          direction: 'to'
        }
      },
      last_message: {
        message: window.ep.$i18n.t('chats.' + message),
        timestamp: 0,
        direction: 'to'
      }
    }
  }
  if (newAccount) {
    Vue.set(state.newChats, partner, 1)
  }
  Vue.set(state.chats, partner, currentDialogs)
}

const store = {
  state: {
    address: '',
    language: defaultLanguage,
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
    sendOnEnter: false,
    showBottom: true,
    partnerName: '',
    partnerDisplayName: '',
    partners: {
      'U7047165086065693428': 'ADAMANT ICO',
      'U15423595369615486571': 'ADAMANT Bounty Wallet'
    },
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
    },
    afterLogin ({ commit }, passPhrase) {
      commit('save_passphrase', {'passPhrase': passPhrase})
      admApi.unlock(passPhrase)
    },
    rehydrate ({ getters }) {
      admApi.unlock(getters.getPassPhrase)
    },
    updateAccount ({ commit }, account) {
      commit('login', account)
    }
  },
  mutations: {
    last_visited_chat (state, payload) {
      state.lastVisitedChat = payload
    },
    force_update (state) {
    },
    change_send_on_enter (state, payload) {
      state.sendOnEnter = payload
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
      state.passPhrase = Base64.encode(payload.passPhrase)
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
      state.delegates = {}
      state.originDelegates = {}
      state.chats = {}
      state.newChats = {}
      state.totalNewChats = 0
      state.currentChat = false
      state.trackNewMessages = false
      state.firstChatLoad = true
      state.lastChatHeight = 0
      state.lastTransactionHeight = 0
      state.partnerDisplayName = ''
      window.publicKey = false
      window.privateKey = false
      window.secretKey = false
      state.publicKey = false
      state.privateKey = false
      state.secretKey = false
      state.lastVisitedChat = null
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
    // transaction_info (state, payload) {
    //   payload.direction = (state.address === payload.recipientId) ? 'to' : 'from'
    //   Vue.set(state.transactions, payload.id, payload)
    // },
    connect (state, payload) {
      state.connectionString = payload.string
    },
    select_chat (state, payload) {
      state.currentChat = state.chats[payload]
      if (!state.chats[payload]) {
        Vue.set(state.chats, payload, {messages: [], last_message: {}, partner: payload})
      }
      Vue.set(state.currentChat, 'messages', state.chats[payload].messages)
      state.partnerName = payload
      state.showPanel = true
      state.showBottom = false
    },
    leave_chat (state, payload) {
      state.showPanel = false
      state.partnerName = ''
      state.partnerDisplayName = ''
      state.showBottom = true
    },
    have_loaded_chats (state) {
      state.firstChatLoad = false
    },
    mock_messages (state) {
      const newAccount = store.state.is_new_account
      createMockMessage(state, newAccount, 'ADAMANT ICO', 'ico_message')
      createMockMessage(state, newAccount, 'ADAMANT Bounty', 'welcome_message')
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
    set_last_chat_height (state, payload) {
      if (state.lastChatHeight < payload) {
        state.lastChatHeight = payload
      }
    },
    // set_last_transaction_height (state, payload) {
    //   if (state.lastTransactionHeight < payload) {
    //     state.lastTransactionHeight = payload
    //   }
    // },
    add_chat_message (state, payload) {
      var me = state.address
      var partner = ''
      payload.real_timestamp = parseInt(payload.timestamp) * 1000 + Date.UTC(2017, 8, 2, 17, 0, 0, 0)
      var direction = 'from'
      if (payload.recipientId === me) {
        direction = 'to'
        partner = payload.senderId
      } else {
        partner = payload.recipientId
      }
      var trackThisMessage = state.trackNewMessages
      if (payload.real_timestamp < window.refreshTime) {
        trackThisMessage = false
      }
      if (state.chats[partner]) {
        if (state.chats[partner].messages[payload.id]) {
          trackThisMessage = false
        }
      }
      if (direction === 'to' && trackThisMessage && state.partnerName !== partner) {
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
      } else if (direction === 'to' && trackThisMessage && document.hidden) {
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
          timestamp: payload.timestamp,
          direction
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
  plugins: [storeData()],
  getters: {
    // Returns decoded pass phrase from store
    getPassPhrase: state => {
      if (state.passPhrase.match(base64regex)) {
        return Base64.decode(state.passPhrase)
      } else {
        return state.passPhrase
      }
    },
    lastVisitedChat: state => {
      return state.lastVisitedChat
    }
  },
  modules: {
    eth: ethModule, // Ethereum-related data
    adm: admModule, // ADM transfers
    partners: partnersModule, // Partners: display names, crypto addresses and so on
    delegates: delegatesModule // Voting for delegates screen
  }
}

export default store
