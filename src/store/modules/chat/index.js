import Vue from 'vue'
import validateAddress from '@/lib/validateAddress'
import * as admApi from '@/lib/adamant-api'
import {
  createChat,
  getChats,
  queueMessage,
  createMessage,
  createTransaction,
  transformMessage
} from '@/lib/chatHelpers'
import { isNumeric } from '@/lib/numericHelpers'
import { EPOCH, Cryptos, TransactionStatus as TS } from '@/lib/constants'

/**
 * type State {
 *   chats: {
 *     [senderId: string]: Chat
 *   },
 *   lastMessageHeight: number,
 *   isFulfilled: boolean
 * }
 *
 * type Chat {
 *   messages: Message[],
 *   numOfNewMessages: number,
 *   readOnly?: boolean // for Welcome to ADAMANT & ADAMANT Tokens chats,
 *   scrollPosition: number // current scroll position of AChat component
 * }
 *
 */
const state = () => ({
  chats: {},
  lastMessageHeight: 0, // `height` value of the last message
  isFulfilled: false // false - getChats did not start or in progress, true - getChats finished
})

const getters = {
  /**
   * Returns partner IDs.
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
   * Return message by ID.
   * @param {number} id Message Id
   * @returns {Message}
   */
  messageById: (state, getters) => id => {
    const partnerIds = getters.partners
    let message

    partnerIds.forEach((senderId) => {
      const found = getters.messages(senderId).find(
        message => message.id === id
      )

      if (found) {
        message = found
      }
    })

    return message
  },

  /**
   * Returns message by partnerId & messageId.
   * @param {string} partnerId
   * @param {number} messageId
   * @returns {Message}
   */
  partnerMessageById: (state, getters) => (partnerId, messageId) => {
    const messages = getters.messages(partnerId)

    return messages.find(message => message.id === messageId)
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
    const message = getters.lastMessage(senderId) || {}

    return (message && message.message) || ''
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
  },

  /**
   * Get unread messages from all chats.
   * @returns {Message[]}
   */
  unreadMessages: (state, getters) => {
    let messages = []

    getters.partners.forEach(partnerId => {
      const numOfNewMessages = getters.numOfNewMessages(partnerId)

      // get last `n` messages
      const partnerMessages = getters.messages(partnerId)
      const lastPartnerMessages = partnerMessages
        .slice(partnerMessages.length - numOfNewMessages)

      messages = [...messages, ...lastPartnerMessages]
    })

    return messages
  },

  /**
   * Returns last unread message from all chats.
   * @returns {Message|null}
   */
  lastUnreadMessage: (state, getters) => {
    const length = getters.unreadMessages.length

    return getters.unreadMessages[length - 1] || null
  },

  lastMessages: (state, getters) => {
    const partners = getters.partners

    return partners
      .map(partnerId => {
        const message = getters.lastMessage(partnerId)

        return {
          timestamp: Date.now(), // give priority to new chats without messages (will be overwritten by ...message)
          ...message,
          contactId: partnerId
        }
      })
      .sort((left, right) => right.timestamp - left.timestamp)
  },

  scrollPosition: state => contactId => {
    const chat = state.chats[contactId]

    if (chat && chat.scrollPosition !== undefined) {
      return chat.scrollPosition
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

    // Shouldn't duplicate local messages added directly
    // when dispatch('getNewMessages'). Just update `status`.
    const localMessage = chat.messages.find(localMessage => localMessage.id === message.id)
    if (localMessage) { // is message in state
      localMessage.status = message.status
      return
    }

    // Shouldn't duplicate third-party crypto transactions
    if (
      message.type &&
      message.type !== 'message' &&
      message.type !== Cryptos.ADM
    ) {
      const localTransaction = chat.messages.find(localTransaction => localTransaction.hash === message.hash)
      if (localTransaction) return
    }

    chat.messages.push(message)

    // If this is a new message, increment `numOfNewMessages`.
    // Exception only when `height = 0`, this means that the
    // user cleared `localStorage` or logged in first time.
    if (
      message.height > state.lastMessageHeight &&
      state.lastMessageHeight > 0 &&
      userId !== message.senderId // do not notify yourself when send message from other device
    ) {
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
   * Add `Welcome to ADAMANT` & `ADAMANT Tokens` to state.chats.
   */
  createAdamantChats (state) {
    const bountyMessages = [
      {
        id: 'b1',
        message: 'chats.welcome_message',
        timestamp: EPOCH,
        senderId: 'chats.welcome_message_title',
        type: 'message',
        i18n: true,
        status: TS.DELIVERED
      }
    ]

    Vue.set(state.chats, 'chats.welcome_message_title', {
      messages: bountyMessages,
      numOfNewMessages: 0,
      readOnly: true
    })
  },

  updateScrollPosition (state, { contactId, scrollPosition }) {
    const chat = state.chats[contactId]

    if (chat) {
      chat.scrollPosition = scrollPosition
    }
  },

  reset (state) {
    state.chats = {}
    state.lastMessageHeight = 0
    state.isFulfilled = false
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
        message: transformMessage(message),
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
   * @returns {Promise}
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
          status: TS.PENDING, // not confirmed yet, wait to be stored in the blockchain (optional line)
          partnerId: recipientId
        })

        return res
      })
      .catch(err => {
        // update `message.status` to 'rejected'
        commit('updateMessage', {
          id: messageObject.id,
          status: TS.REJECTED,
          partnerId: recipientId
        })

        throw err // call the error again so that it can be processed inside view
      })
  },

  /**
   * Resend message, in case the connection fails.
   * @param {string} id Recipient Id
   * @param {number} id Message Id
   * @returns {Promise}
   */
  resendMessage ({ getters, commit }, { recipientId, messageId }) {
    const message = getters.partnerMessageById(recipientId, messageId)

    // update message status from `rejected` to `sent`
    // and then resendMessage
    commit('updateMessage', {
      id: messageId,
      status: TS.PENDING,
      partnerId: recipientId
    })

    if (message) {
      return queueMessage(message.message, recipientId)
        .then(res => {
          if (!res.success) {
            throw new Error('Message rejected')
          }

          commit('updateMessage', {
            id: messageId,
            realId: res.transactionId,
            status: TS.PENDING,
            partnerId: recipientId
          })

          return res
        })
        .catch(err => {
          commit('updateMessage', {
            id: messageId,
            status: TS.REJECTED,
            partnerId: recipientId
          })

          throw err
        })
    }

    return Promise.reject(new Error('Message not found in history'))
  },

  /**
   * Fast crypto-transfer, to display transaction in chat
   * before confirmation.
   * @param {number} transactionId
   * @param {string} recipientId
   * @param {string} type ADM, ETH...
   * @param {string} status Can be: `sent`, `confirmed`, 'rejected'
   * @param {number} amount
   * @param {string} hash Transaction hash
   * @param {string} comment Transaction comment
   * @returns {number} Transaction ID
   */
  pushTransaction ({ commit, rootState }, payload) {
    const {
      transactionId,
      recipientId,
      type,
      status,
      amount,
      hash,
      comment = ''
    } = payload

    const transactionObject = createTransaction({
      transactionId,
      recipientId,
      type,
      status,
      amount,
      hash,
      comment,
      senderId: rootState.address
    })

    commit('pushMessage', {
      message: transactionObject,
      userId: rootState.address
    })

    // reset scroll position
    commit('updateScrollPosition', {
      contactId: recipientId,
      scrollPosition: undefined
    })

    return transactionObject.id
  },

  /** Resets module state **/
  reset: {
    root: true,
    handler ({ commit }) {
      commit('reset')
    }
  }
}

export default {
  state,
  getters,
  mutations,
  actions,
  namespaced: true
}
