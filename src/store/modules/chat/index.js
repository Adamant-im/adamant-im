import Vue from 'vue'
import validateAddress from '@/lib/validateAddress'
import * as admApi from '@/lib/adamant-api'
import { createChat, getChats, queueMessage, createMessage } from '@/lib/chatHelpers'
import { isNumeric } from '@/lib/numericHelpers'

/**
 * interface State {
 *   chats: {
 *     [senderId: string]: Chat
 *   },
 *   lastMessageHeight: number,
 *   isFulfilled: boolean
 * }
 *
 * interface Chat {
 *   messages: Message[],
 *   numOfNewMessages: number,
 *   readOnly?: boolean // for Adamant Bounty & Adamant Tokens chats
 * }
 *
 * interface Message {
 *   id: number,
 *   message: {string|Object}, // `Object` when eth transaction
 *   senderId: string,
 *   recipientId: string,
 *   amount: number,
 *   timestamp: number
 *   ...
 *   status?: enum('sent', 'confirmed', 'rejected' // assigned locally (default = confirmed)
 * }
 */
const state = () => ({
  chats: {},
  lastMessageHeight: 0, // `height` value of the last message
  isFulfilled: false
})

const getters = {
  /**
   * Returns partners IDs.
   * @returns {string[]}
   */
  partners: state => Object.keys(state.chats),

  /**
   * Returns messages by senderId.
   * @param {string} senderId
   * @returns {Message[]}
   */
  messages: state => senderId => {
    const chat = state.chats[senderId]

    if (chat) {
      return chat.messages
    }

    return []
  },

  /**
   * Returns last message by senderId.
   * @param {string} senderId
   * @returns {Message}
   */
  lastMessage: (state, getters) => senderId => {
    const senderIds = getters.partners

    if (senderIds.includes(senderId)) {
      const chat = state.chats[senderId]
      const messages = chat.messages
      const length = messages.length

      if (length > 0) {
        return messages[length - 1]
      }
    }

    return null
  },

  /**
   * Returns last message (only text)
   * @param {string} senderId
   * @returns {string}
   */
  lastMessageText: (state, getters) => senderId => {
    const abstract = getters.lastMessage(senderId) || {}

    // if ETH Transaction
    if (abstract.message && abstract.message.type === 'eth_transaction') {
      return abstract.message.comments || ''
    }

    if (typeof abstract.message === 'string') {
      return abstract.message
    }

    return ''
  },

  /**
   * Returns last message timestamp.
   * @param {string} senderId
   * @returns {string}
   */
  lastMessageTimestamp: (state, getters) => senderId => {
    const abstract = getters.lastMessage(senderId)

    if (abstract && isNumeric(abstract.timestamp)) {
      return abstract.timestamp
    }

    return ''
  },

  isPartnerInChatList: (state, getters) => senderId => {
    return getters.partners.includes(senderId)
  },

  /**
   * Returns number of new messages by senderId.
   * @param {string} senderId
   * @returns {number}
   */
  numOfNewMessages: state => senderId => {
    const chat = state.chats[senderId]

    if (chat) {
      return chat.numOfNewMessages
    }

    return 0
  },

  /**
   * Returns total number of new messages.
   * @returns {number}
   */
  totalNumOfNewMessages: state => {
    const senderIds = Object.keys(state.chats)

    return senderIds.reduce(
      (acc, senderId) => state.chats[senderId].numOfNewMessages + acc,
      0
    )
  },

  /**
   * @param {string} partnerId
   */
  isChatReadOnly: state => partnerId => {
    const chat = state.chats[partnerId]

    if (chat && chat.readOnly) {
      return true
    }

    return false
  }
}

const mutations = {
  /**
   * @param {number} height
   */
  setHeight (state, height) {
    state.lastMessageHeight = height
  },

  /**
   * When chats are loaded, set to `true`.
   * @param {boolean} value
   */
  setFulfilled (state, value) {
    state.isFulfilled = value
  },

  /**
   * Create empty chat.
   * @param {string} partnerId
   */
  createEmptyChat (state, partnerId) {
    const chat = state.chats[partnerId]

    // if the chat already exists, nothing to do
    if (chat) {
      return
    }

    Vue.set(state.chats, partnerId, createChat())
  },

  /**
   * Push an message to a specific chat by senderId.
   * @param {string} userId Your address
   */
  pushMessage (state, { message, userId }) {
    let partnerId = message.senderId === userId
      ? message.recipientId
      : message.senderId

    // Create chat if not exists
    if (!state.chats[partnerId]) {
      Vue.set(state.chats, partnerId, createChat())
    }

    const chat = state.chats[partnerId]

    // shouldn't duplicate local messages added directly
    // when dispatch('getNewMessages')
    const isMessageInList = chat.messages.find(localMessage => localMessage.id === message.id)
    if (isMessageInList) {
      return
    }

    chat.messages.push(message)

    // If this is a new message, increment `numOfNewMessages`.
    // Exception only when `height = 0`, this means that the
    // user cleared `localStorage` or logged in first time.
    if (message.height > state.lastMessageHeight && state.lastMessageHeight > 0) {
      chat.numOfNewMessages += 1
    }
  },

  /**
   * Mark messages of specific chat as read.
   * @param {string} partnerId
   */
  markAsRead (state, partnerId) {
    const chat = state.chats[partnerId]

    if (chat) {
      chat.numOfNewMessages = 0
    }
  },

  /**
   * Marks all chats as read.
   */
  markAllAsRead (state) {
    const senderIds = Object.keys(state.chats)

    senderIds.forEach(senderId => {
      state.chats[senderId].numOfNewMessages = 0
    })
  },

  /**
   * Update message `id` & `status` when
   * confirmation was received from the server.
   *
   * @param {string} partnerId
   * @param {string} id Local id (random generated)
   * @param {string} realId Real id (from server)
   * @param {string} status Message status
   */
  updateMessage (state, { partnerId, id, realId, status }) {
    const chat = state.chats[partnerId]

    if (chat) {
      const message = chat.messages.find(message => message.id === id)

      if (message) {
        if (realId) {
          message.id = realId
        }
        if (status) {
          message.status = status
        }
      }
    }
  },

  /**
   * Add `Adamant Bounty` & `Adamant Tokens` to state.chats.
   */
  createAdamantChats (state) {
    const bountyMessages = [
      {
        id: 'b1',
        message: 'chats.welcome_message',
        timestamp: 0,
        senderId: 'Adamant Bounty',
        i18n: true
      }
    ]

    const tokensMessages = [
      {
        id: 't1',
        message: 'chats.ico_message',
        timestamp: 0,
        senderId: 'Adamant Tokens',
        i18n: true
      }
    ]

    Vue.set(state.chats, 'Adamant Bounty', {
      messages: bountyMessages,
      readOnly: true
    })
    Vue.set(state.chats, 'Adamant Tokens', {
      messages: tokensMessages,
      readOnly: true
    })
  }
}

const actions = {
  /**
   * Get all messages from the server starting from the oldest.
   * Must be called once during initialization.
   *
   * Important:
   *  - `getChats` is a recursive function
   *
   * @returns {Promise}
   */
  loadChats ({ state, commit, dispatch }) {
    commit('setFulfilled', false)

    return getChats(state.lastMessageHeight)
      .then(result => {
        const { messages, lastMessageHeight } = result

        dispatch('pushMessages', messages)

        if (lastMessageHeight > 0) {
          commit('setHeight', lastMessageHeight)
        }

        commit('setFulfilled', true)
      })
  },

  /**
   * Push array of messages and sort by senderId.
   * @param {Message[]} messages Array of messages
   */
  pushMessages ({ commit, rootState }, messages) {
    messages.forEach(message => {
      commit('pushMessage', {
        message,
        userId: rootState.address
      })
    })
  },

  /**
   * Request for new messages.
   * This is a temporary solution until the sockets are implemented.
   * @returns {Promise}
   */
  getNewMessages ({ state, commit, dispatch }) {
    if (!state.isFulfilled) {
      return Promise.reject(new Error('Chat is not fulfilled'))
    }

    return getChats(state.lastMessageHeight)
      .then(result => {
        const { messages, lastMessageHeight } = result

        dispatch('pushMessages', messages)

        if (lastMessageHeight > 0) {
          commit('setHeight', lastMessageHeight)
        }
      })
  },

  /**
   * Starts new chat with specified address.
   *
   * 1. Validate partner address.
   * 2. Get partner publicKey.
   * 3. Set partner name if provided.
   * 4. Create empty chat.
   *
   * @todo Do I need to save the partner public key in state?
   */
  createChat ({ commit }, { partnerId, partnerName = '' }) {
    if (!validateAddress('ADM', partnerId)) {
      return Promise.reject(new Error('Invalid user address'))
    }

    return admApi.getPublicKey(partnerId)
      .then(key => {
        // @todo this check must be performed on the server and return error 400 instead of 200
        if (!key) {
          throw new Error('Account not found')
        }

        return key
      })
      .then(key => {
        // set partner name if provided
        if (partnerName) {
          commit('partners/displayName', {
            partner: partnerId,
            displayName: partnerName
          }, { root: true })
        }

        commit('createEmptyChat', partnerId)

        return key
      })
  },

  /**
   * Adds a message to the chat, and sends it to the server.
   * After confirmation, `id` and `status` will be updated.
   *
   * @param {string} message
   * @param {string} recipientId
   */
  sendMessage ({ commit, rootState }, { message, recipientId }) {
    const messageObject = createMessage({
      message,
      recipientId,
      senderId: rootState.address
    })

    commit('pushMessage', {
      message: messageObject,
      userId: rootState.address
    })

    return queueMessage(message, recipientId)
      .then(res => {
        // @todo this check must be performed on the server
        if (!res.success) {
          throw new Error('Message rejected')
        }

        // update `message.status` to 'confirmed'
        // and `message.id` with `realId` from server
        commit('updateMessage', {
          id: messageObject.id,
          realId: res.transactionId,
          status: 'confirmed',
          partnerId: recipientId
        })

        return res
      })
      .catch(err => {
        // update `message.status` to 'rejected'
        commit('updateMessage', {
          id: messageObject.id,
          status: 'rejected',
          partnerId: recipientId
        })

        throw err // call the error again so that it can be processed inside view
      })
  }
}

export default {
  state,
  getters,
  mutations,
  actions,
  namespaced: true
}
