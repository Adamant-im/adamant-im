
import Vue from 'vue'
import { Base64 } from 'js-base64'

import storeData from '../lib/lsStore.js'

import ethModule from './modules/eth'
import erc20Module from './modules/erc20'
import partnersModule from './modules/partners'
import admModule from './modules/adm'
import nodesModule from './modules/nodes'

import delegatesModule from './modules/delegates'

import nodesPlugin from './modules/nodes/nodes-plugin'

import * as admApi from '../lib/adamant-api'
import { base64regex, WelcomeMessage, UserPasswordHashSettings, Cryptos } from '../lib/constants'
import Queue from 'promise-queue'
import utils from '../lib/adamant'
import i18n from '../i18n'
import crypto from 'pbkdf2'
import renderMarkdown from '../lib/markdown'

var maxConcurrent = 1
var maxQueue = Infinity
Queue.configure(window.Promise)
var queue = new Queue(maxConcurrent, maxQueue)

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
          message: i18n.t('chats.' + message),
          timestamp: 0,
          direction: 'to'
        }
      },
      last_message: {
        message: i18n.t('chats.' + message),
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

export function replaceMessageAndDelete (messages, newMessageId, existMessageId, cssClass) {
  Vue.set(messages, newMessageId, {
    ...messages[existMessageId],
    id: newMessageId,
    confirm_class: cssClass
  })
  if (existMessageId != null) {
    Vue.delete(messages, existMessageId)
  }
}

function deleteMessage (state, payload) {
  if (!state.chats[payload.recipientId]) {
    return
  }
  const messages = state.chats[payload.recipientId].messages
  if (payload.message.hash) {
    Vue.delete(messages, payload.message.hash)
  }
}

export function changeMessageClass (messages, id, cssClass) {
  Vue.set(messages[id], 'confirm_class', cssClass)
}

export function updateLastChatMessage (currentDialogs, payload, confirmClass, direction, id) {
  currentDialogs.last_message = {
    id: id,
    message: payload.message,
    timestamp: payload.timestamp,
    confirm_class: confirmClass,
    direction
  }
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
    firstChatLoad: false,
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
    storeInLocalStorage: false,
    lastVisitedChat: '',
    areChatsLoading: false,
    userPasswordExists: sessionStorage.getItem('userPassword') !== null
  },
  actions: {
    createStubMessage (state, payload) {
      const timestamp = utils.epochTime()
      // Build chat message
      let message = payload.message

      let contacts = Object.entries(state.getters.getContacts.list)
      let ADMAddress
      contacts.forEach((contact) => {
        const ethAddress = contact[1].ETH
        if (ethAddress === payload.targetAddress) {
          ADMAddress = contact[0]
        }
      })
      let handledPayload = {
        timestamp: timestamp,
        message: {
          amount: message.amount,
          comments: message.comments || '',
          type: message.type
        },
        direction: 'from',
        confirm_class: 'sent',
        id: payload.hash
      }
      let currentDialog = state.getters.getChats[ADMAddress]
      if (currentDialog) {
        if (handledPayload.message.comments === '') {
          handledPayload.message.comments = 'sent ' + (message.amount) + ' ' + message.fundType
          handledPayload.message.comments = handledPayload.message.comments.replace(/<p>|<\/p>/g, '')
          updateLastChatMessage(currentDialog, handledPayload, 'sent', 'from', handledPayload.id)
          handledPayload.message.comments = ''
        } else {
          handledPayload.message.comments = handledPayload.message.comments.replace(/<p>|<\/p>/g, '')
          updateLastChatMessage(currentDialog, handledPayload, 'sent', 'from', handledPayload.id)
        }
        Vue.set(currentDialog.messages, handledPayload.id, handledPayload)
      }
    },
    update_delegates_grid ({ commit }, payload) {
      commit('update_delegate', payload)
    },
    add_chat_i18n_message ({ commit }, payload) {
      payload.message = i18n.t(payload.message)
      commit('add_chat_message', payload)
    },
    rehydrate ({ getters }) {
      admApi.unlock(getters.getPassPhrase)
    },
    add_message_to_queue ({ getters }, payload) {
      if (payload.message === undefined || payload.message.trim() === '') {
        return
      }
      let chats = getters.getChats
      const partner = payload.recipientId
      let messageText = payload.message
      payload = {
        message: messageText,
        recipientId: partner,
        timestamp: utils.epochTime(),
        id: getters.getCurrentChatMessageCount,
        confirm_class: 'sent',
        direction: 'from'
      }
      let currentDialogs = chats[partner]
      let internalPayload = Object.assign({}, payload)
      if (currentDialogs.last_message.timestamp < payload.timestamp || !currentDialogs.last_message.timestamp) {
        internalPayload.message = renderMarkdown(internalPayload.message)
        updateLastChatMessage(currentDialogs, internalPayload, 'sent', 'from', payload.id)
      }
      Vue.set(chats[partner].messages, payload.id, internalPayload)
      queue.add(() => {
        const params = {
          to: partner,
          message: messageText
        }
        return admApi.sendMessage(params).then(response => {
          if (response.success) {
            replaceMessageAndDelete(chats[partner].messages, response.transactionId, payload.id, 'sent')
            updateLastChatMessage(currentDialogs, internalPayload, 'sent', 'from', response.transactionId)
          } else {
            changeMessageClass(chats[partner].messages, payload.id, 'rejected')
            updateLastChatMessage(currentDialogs, internalPayload, 'rejected', 'from', payload.id)
          }
        })
      })
    },
    retry_message ({ getters }, payload) {
      const currentChat = getters.getCurrentChat
      const partner = currentChat.partner
      let message = currentChat.messages[payload]
      let messageText = message.message
      messageText = messageText.replace(/<p>|<\/?p>/g, '')
      messageText = messageText.replace(/<a href=".*">|<\/?a>/g, '')
      messageText = messageText.replace(/<br>/g, '\n')
      payload = {
        recipientId: partner,
        message: message.message,
        transactionId: message.id,
        timestamp: utils.epochTime(),
        direction: 'from'
      }
      let chats = getters.getChats
      queue.add(() => {
        const params = {
          to: partner,
          message: messageText
        }
        return admApi.sendMessage(params).then(response => {
          if (response.success) {
            Vue.delete(chats[partner].messages, payload.transactionId)
            Vue.set(chats[partner].messages, response.transactionId, {
              message: payload.message,
              timestamp: payload.timestamp,
              id: response.transactionId,
              confirm_class: 'sent',
              direction: 'from'
            })
          }
          updateLastChatMessage(currentChat, payload, 'sent', 'from', response.transactionId)
        })
      })
    },
    clearUserPassword ({ commit }) {
      localStorage.removeItem('storedData')
      sessionStorage.removeItem('userPassword')
      commit('user_password_exists', false)
      commit('change_storage_method', false)
    },
    /**
     * Performs application login
     * @param {any} context
     * @param {{passphrase: string}} payload action payload
     */
    login (context, payload) {
      return new Promise((resolve, reject) => {
        try {
          const address = admApi.unlock(payload.passphrase)
          resolve(address)
        } catch (e) {
          reject(e)
        }
      }).then(address => {
        context.commit('currentAccount', { address })
        context.commit('save_passphrase', { passPhrase: payload.passphrase })
        context.commit('mock_messages')
        context.commit('stop_tracking_new')

        context.dispatch('update')
        context.dispatch('afterLogin', payload.passphrase)
      })
    },
    /**
     * Updates current account details. If an account does not yet exist in the ADAMANT
     * network, it is created.
     */
    updateAccount (context) {
      context.commit('ajax_start')
      return admApi.getCurrentAccount(context).then(
        (account) => {
          context.commit('currentAccount', account)
          context.commit('ajax_end')
        },
        (error) => {
          console.error(error)
          context.commit('ajax_end_with_error')
          return Promise.reject(error)
        }
      )
    },
    /**
     * Retrieve the chat messages for the current account.
     * @param {any} context action context
     * @param {{height: number, offset: number, recurse: boolean}} payload height and offset
     */
    loadChats (context, payload = { }) {
      if (context.state.areChatsLoading && !payload.recurse) return

      const height = Number.isFinite(payload.height)
        ? payload.height
        : (context.state.lastChatHeight || 0)
      const offset = payload.offset || 0

      context.commit('ajax_start')
      context.commit('chatsLoading', true)

      admApi.getChats(height, offset).then(
        result => {
          context.commit('ajax_end')

          const { count, transactions } = result

          // Add the received chat messages to the store
          transactions.forEach(tx => {
            if (!tx || !tx.message) return
            if (tx.isI18n) {
              context.dispatch('add_chat_i18n_message', tx)
            } else {
              context.commit('add_chat_message', tx)
            }
            context.commit('set_last_chat_height', tx.height)
          })

          // We need to check if there are more chats to fetch.
          // API is supposed to return the total number of the chats available (the `count` field), but it may not.
          // In the latter case we check the number of the transactions returned: if its 100 (default chunk size),
          // we assume that more transactions may be available.
          const hasMore = Number.isFinite(count)
            ? count > (offset + transactions.length)
            : transactions.length === 100 // a dirty workaround, actually

          // If there are more messages to retrieve, go for'em
          if (hasMore) {
            context.dispatch('loadChats', {
              height,
              offset: offset + transactions.length,
              recurse: true
            })
          } else {
            context.commit('have_loaded_chats')
            context.commit('chatsLoading', false)
          }
        },
        error => {
          console.warn('Failed to retrieve chat messages', { height, offset, error })
          context.commit('ajax_end_with_error')
          context.commit('chatsLoading', false)
        }
      )
    },
    updateChatHeight (context, payload) {
      context.commit('set_last_chat_height', payload)
    },
    /**
     * Updates current application status: balance, chat messages, transactions and so on
     * @param {any} context Vuex action context
     */
    update (context) {
      if (context.getters.getPassPhrase && !context.state.ajaxIsOngoing) {
        context.dispatch('updateAccount')
        context.commit('start_tracking_new')
        context.dispatch('loadChats')
        // TODO: Remove this, when it will be possible to fetch transactions together with the chat messages
        context.dispatch('adm/getNewTransactions')
      }
    },
    /** Starts new chat with the specified address */
    startChat (context, { address, displayName }) {
      return admApi.getPublicKey(address).then((key) => {
        if (!key) throw new Error('not_found')
        context.commit('create_chat', address)
        context.commit('select_chat', address)
        const partner = context.state.partnerName
        const currentDisplayName = context.getters['partners/displayName'](partner)
        if (!currentDisplayName || currentDisplayName.length === 0) {
          context.commit('partners/displayName', { partner, displayName })
        }
      })
    }
  },
  mutations: {
    set_adm_address (state, payload) {
      state.address = payload
    },
    set_first_load (state) {
      state.firstChatLoad = true
    },
    set_state (state, payload) {
      state = payload
    },
    user_password_exists (state, payload) {
      state.userPasswordExists = payload
    },
    update_delegate (state, payload) {
      state.delegates[payload.address] = payload
    },
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
      sessionStorage.setItem('storeInLocalStorage', payload)
      state.storeInLocalStorage = payload
    },
    save_user_password (state, payload) {
      crypto.pbkdf2(payload, UserPasswordHashSettings.SALT, UserPasswordHashSettings.ITERATIONS, UserPasswordHashSettings.KEYLEN, UserPasswordHashSettings.DIGEST, (err, encodePassword) => {
        if (err) throw err
        const pass = encodePassword.toString('hex')
        sessionStorage.setItem('userPassword', pass)
      })
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
      state.resentMessages = []
      state.lastVisitedChat = null
      state.areChatsLoading = false
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
        Vue.set(state.newChats, payload, 0)
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
    connect (state, payload) {
      state.connectionString = payload.string
    },
    select_chat (state, payload) {
      if (!state.chats[payload]) {
        Vue.set(state.chats, payload, { messages: [], last_message: {}, partner: payload })
      }
      state.currentChat = state.chats[payload]
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
      createMockMessage(state, newAccount, WelcomeMessage.ADAMANT_ICO, 'ico_message')
      createMockMessage(state, newAccount, WelcomeMessage.ADAMANT_BOUNTY, 'welcome_message')
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

      let confirmClass = 'unconfirmed'
      if (payload.height) {
        confirmClass = 'confirmed'
      }

      payload.confirm_class = confirmClass

      if (currentDialogs.last_message.timestamp < payload.timestamp || !currentDialogs.last_message.timestamp) {
        updateLastChatMessage(currentDialogs, payload, confirmClass, direction, payload.id)
      }
      if (currentDialogs.last_message.id === payload.id) {
        updateLastChatMessage(currentDialogs, payload, confirmClass, direction, payload.id)
      }

      if (currentDialogs.last_message.id === payload.message.hash) {
        updateLastChatMessage(currentDialogs, payload, confirmClass, direction, payload.message.hash)
      }

      if (payload.type === 8 && payload.message.hash) {
        deleteMessage(state, payload)
      }

      payload.confirm_class = 'unconfirmed'

      if (payload.height && direction === 'from') {
        payload.confirm_class = 'confirmed'
      }

      if (payload.height && direction === 'to') {
        payload.confirm_class = ''
      }

      if (!payload && direction === 'from') {
        payload.confirm_class = 'rejected'
      }

      if (payload.height && payload.height > state.lastChatHeight) {
        state.lastChatHeight = payload.height
      }
      Vue.set(state.chats, partner, currentDialogs)
      payload.direction = direction
      Vue.set(state.chats[partner].messages, payload.id, payload)
    },
    currentAccount (state, payload) {
      state.address = payload.address
      state.balance = payload.balance
    },
    chatsLoading (state, payload) {
      state.areChatsLoading = payload
    }
  },
  plugins: [storeData(), nodesPlugin],
  getters: {
    checkForActiveNode: state => {
      let activeNodeIsExist = false
      const nodeList = Object.values(state.nodes.list)
      for (const node of nodeList) {
        if (node.active) {
          activeNodeIsExist = node.active
          break
        }
      }
      return activeNodeIsExist
    },
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
    },
    getCurrentChatMessageCount: state => {
      if ((state.currentChat != null) && (state.currentChat.messages != null)) {
        return Object.keys(state.currentChat.messages).length
      }
      return 0
    },
    getChats: state => {
      return state.chats
    },
    getCurrentChat: state => {
      return state.currentChat
    },
    isStoreInLocalStorage: state => {
      return state.storeInLocalStorage
    },
    isLogged: state => {
      return state.passPhrase.length > 0
    },
    sendOnEnter: state => {
      return state.sendOnEnter
    },
    isLoginViaPassword: () => {
      return sessionStorage.getItem('storeInLocalStorage') === 'true' && sessionStorage.getItem('userPassword')
    },
    getUserPasswordExists: state => {
      return state.userPasswordExists
    },
    getContacts: state => {
      return state.partners
    },
    getLastChatHeight: state => {
      return state.lastChatHeight
    },
    getAdmAddress: state => {
      return state.address
    },
    getDelegateList: state => {
      return state.delegates.delegates || []
    }
  },
  modules: {
    eth: ethModule, // Ethereum-related data
    bnb: erc20Module(Cryptos.BNB, '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', 18),
    bz: erc20Module(Cryptos.BZ, '0x4375e7ad8a01b8ec3ed041399f62d9cd120e0063', 18),
    adm: admModule, // ADM transfers
    partners: partnersModule, // Partners: display names, crypto addresses and so on
    delegates: delegatesModule, // Voting for delegates screen
    nodes: nodesModule // ADAMANT nodes
  }
}

export default store
