import { getPublicKey } from '@/lib/adamant-api'
import validateAddress from '@/lib/validateAddress'
import * as admApi from '@/lib/adamant-api'
import {
  createChat,
  getChats,
  queueMessage,
  createMessage,
  createTransaction,
  createReaction,
  normalizeMessage,
  createAttachment,
  queueSignedMessage
} from '@/lib/chat/helpers'
import { i18n } from '@/i18n'
import { isNumeric } from '@/lib/numericHelpers'
import {
  CHAT_ACTUALITY_BUFFER_MS,
  Cryptos,
  CryptosInfo,
  TransactionStatus as TS,
  MessageType
} from '@/lib/constants'
import { isStringEqualCI } from '@/lib/textHelpers'
import { replyMessageAsset, attachmentAsset } from '@/lib/adamant-api/asset'
import { uploadFiles } from '../../../lib/files'
import { generateAdamantChats } from './utils/generateAdamantChats'
import {
  AllNodesDisabledError,
  AllNodesOfflineError,
  isAllNodesDisabledError,
  isAllNodesOfflineError
} from '@/lib/nodes/utils/errors'
import adamant from '@/lib/adamant'

export let interval

const SOCKET_ENABLED_TIMEOUT = 10000
const SOCKET_DISABLED_TIMEOUT = 3000

/**
 * type State = {
 *   chats: {
 *     [senderId: string]: Chat
 *   },
 *   lastMessageHeight: number,
 *   isFulfilled: boolean
 * }
 *
 * type Chat = {
 *   messages: Message[],
 *   numOfNewMessages: number,
 *   readOnly?: boolean, // for Welcome to ADAMANT & ADAMANT Tokens chats
 *   offset: number, // for loading chat history,
 *   page: number, // for loading chat history,
 *   scrollPosition: number // current scroll position of AChat component
 * }
 *
 */
const state = () => ({
  chats: {},
  lastMessageHeight: 0, // `height` value of the last message
  isFulfilled: false, // false - getChats did not start or in progress, true - getChats finished
  offset: 0, // for loading chat list with pagination. -1 if all of chats loaded
  noActiveNodesDialog: undefined, // true - visible dialog, false - hidden dialog, but shown before, undefined - not shown
  newChats: {}, // { [partnerId]: partnerName }, for pointing if a chat needs further handling after being opened
  chatsActualUntil: 0,
  pendingMessages: {}
})

const getters = {
  /**
   * Returns partner IDs.
   * @returns {string[]}
   */
  partners: (state) => Object.keys(state.chats),

  /**
   * Returns messages by senderId.
   * @param {string} senderId
   * @returns {Message[]}
   */
  messages: (state) => (senderId) => {
    const chat = state.chats[senderId]

    if (chat) {
      return [...chat.messages].sort((left, right) => left.timestamp - right.timestamp)
    }

    return []
  },

  /**
   * Returns the timeout for chatsActual
   * @depends options.useSocketConnection
   * @returns {number}
   */
  chatsPollingTimeout: (state, getters, rootState) => {
    return rootState.options.useSocketConnection ? SOCKET_ENABLED_TIMEOUT : SOCKET_DISABLED_TIMEOUT
  },

  reactions: (state, getters) => (transactionId, partnerId) => {
    const messages = getters.messages(partnerId)

    return messages.filter(
      (message) => message.type === 'reaction' && message.asset.reactto_id === transactionId
    )
  },

  reactionsBySenderId: (state, getters) => (transactionId, partnerId, senderId) => {
    const reactions = getters.reactions(transactionId, partnerId)

    return reactions.filter((reaction) => reaction.senderId === senderId)
  },

  lastReaction: (state, getters) => (transactionId, partnerId, senderId) => {
    const reactions = getters.reactionsBySenderId(transactionId, partnerId, senderId)

    if (reactions.length === 0) return null

    return reactions[reactions.length - 1]
  },

  isLastReaction: (state, getters) => (transactionId, partnerId) => {
    const messages = getters.messages(partnerId)
    const index = messages.findIndex((message) => message.id === transactionId)

    return index === messages.length - 1
  },

  /**
   * Return message by ID.
   * @param {number} id Message Id
   * @returns {Message}
   */
  messageById: (state, getters) => (id) => {
    const partnerIds = getters.partners
    let message

    partnerIds.forEach((senderId) => {
      const found = getters.messages(senderId).find((message) => message.id === id)

      if (found) {
        message = found
      }
    })

    return message
  },

  /**
   * Return message index by transaction ID (0 = last message in the chat)
   * @returns {number}
   */
  indexOfMessage: (state, getters) => (partnerId, messageId) => {
    const messages = getters.messages(partnerId).filter((message) => message.type !== 'reaction')
    const message = messages.find((message) => message.id === messageId)

    if (!message) {
      return -1
    }

    const index = messages.indexOf(message)

    if (index === -1) {
      return -1
    }

    return messages.length - 1 - index // reverse index
  },

  /**
   * Returns message by partnerId & messageId.
   * @param {string} partnerId
   * @param {number} messageId
   * @returns {Message}
   */
  partnerMessageById: (state, getters) => (partnerId, messageId) => {
    const messages = getters.messages(partnerId)

    return messages.find((message) => message.id === messageId)
  },

  /**
   * Returns last message by senderId.
   * @param {string} senderId
   * @returns {Message}
   */
  lastMessage: (state, getters) => (senderId) => {
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
  lastMessageText: (state, getters) => (senderId) => {
    const message = getters.lastMessage(senderId) || {}

    return (message && message.message) || ''
  },

  /**
   * Returns last message timestamp.
   * @param {string} senderId
   * @returns {string}
   */
  lastMessageTimestamp: (state, getters) => (senderId) => {
    const abstract = getters.lastMessage(senderId)

    if (abstract && isNumeric(abstract.timestamp)) {
      return abstract.timestamp
    }

    return ''
  },

  isPartnerInChatList: (state, getters) => (senderId) => {
    return getters.partners.includes(senderId)
  },

  /**
   * Returns number of new messages by senderId.
   * @param {string} senderId
   * @returns {number}
   */
  numOfNewMessages: (state) => (senderId) => {
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
  totalNumOfNewMessages: (state) => {
    const senderIds = Object.keys(state.chats)

    return senderIds.reduce((acc, senderId) => state.chats[senderId].numOfNewMessages + acc, 0)
  },

  numWithoutTheCurrentChat: (state, getters) => (senderId) => {
    const totalNumOfNewMessages = getters.totalNumOfNewMessages
    const numOfNewMessages = getters.numOfNewMessages(senderId)
    return totalNumOfNewMessages - numOfNewMessages
  },

  /**
   * Get unread messages from all chats.
   * @returns {Message[]}
   */
  unreadMessages: (state, getters) => {
    let messages = []

    getters.partners.forEach((partnerId) => {
      const numOfNewMessages = getters.numOfNewMessages(partnerId)

      // get last `n` messages
      const partnerMessages = getters.messages(partnerId)
      const lastPartnerMessages = partnerMessages.slice(partnerMessages.length - numOfNewMessages)

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
      .map((partnerId) => {
        const message = getters.lastMessage(partnerId)

        return {
          lastMessage: {
            timestamp: Date.now(), // give priority to new chats without messages (will be overwritten by ...message)
            ...message
          },
          contactId: partnerId
        }
      })
      .sort((left, right) => right.lastMessage.timestamp - left.lastMessage.timestamp)
  },

  scrollPosition: (state) => (contactId) => {
    const chat = state.chats[contactId]

    if (chat && chat.scrollPosition !== undefined) {
      return chat.scrollPosition
    }

    return false
  },

  /**
   * Offset for chat with contactId
   */
  chatOffset: (state) => (contactId) => {
    const chat = state.chats[contactId]

    return (chat && chat.offset) || 0
  },

  /**
   * Current chat history page.
   */
  chatPage: (state) => (contactId) => {
    const chat = state.chats[contactId]

    return (chat && chat.page) || 0
  },

  isNoNodesDialogAllowed: (state, getters, rootState, rootGetters) => (err) => {
    const isOnline = rootState.isOnline
    const admNodes = rootGetters['nodes/adm']
    const areAdmNodesDisabled = admNodes.some((node) => node.status === 'disabled')

    return isOnline && areAdmNodesDisabled && isAllNodesOfflineError(err)
  },

  /**
   * Offset for chat list
   */
  chatListOffset: (state) => {
    return state.offset
  },

  isNewChat: (state) => (partnerId) => {
    return partnerId in state.newChats
  },

  getPartnerName: (state) => (partnerId) => {
    return state.newChats[partnerId]
  }
}

const mutations = {
  /**
   * @param {number} height
   */
  setHeight(state, height) {
    state.lastMessageHeight = height
  },

  setChatOffset(state, { contactId, offset }) {
    const chat = state.chats[contactId]

    if (chat) {
      chat.offset = offset
    }
  },

  setChatPage(state, { contactId, page }) {
    const chat = state.chats[contactId]

    if (chat) {
      chat.page = page
    }
  },

  setOffset(state, offset) {
    state.offset = offset
  },

  /**
   * When chats are loaded, set to `true`.
   * @param {boolean} value
   */
  setFulfilled(state, value) {
    state.isFulfilled = value
  },

  setChatsActualUntil(state, value) {
    state.chatsActualUntil = value
  },

  /**
   * Create empty chat.
   * @param {string} partnerId
   */
  createEmptyChat(state, partnerId) {
    const chat = state.chats[partnerId]

    // if the chat already exists, nothing to do
    if (chat) {
      return
    }

    state.chats[partnerId] = createChat()
  },

  addNewChat(state, { partnerId, partnerName }) {
    state.newChats[partnerId] = partnerName
  },

  removeNewChat(state, partnerId) {
    delete state.newChats[partnerId]
  },

  /**
   * Push an message to a specific chat by senderId.
   * @param {string} userId Your address
   */
  pushMessage(state, { message, userId, unshift = false }) {
    const partnerId = isStringEqualCI(message.senderId, userId)
      ? message.recipientId
      : message.senderId

    // Create chat if not exists
    if (!state.chats[partnerId]) {
      state.chats[partnerId] = createChat()
    }

    const chat = state.chats[partnerId]

    // Shouldn't duplicate local messages added directly
    // when dispatch('getNewMessages'). Just update `status, height`.
    const localMessage = chat.messages.find((localMessage) => localMessage.id === message.id)
    if (localMessage) {
      // is message in state
      localMessage.status = message.status
      localMessage.height = message.height
      return
    }

    // Shouldn't duplicate third-party crypto transactions
    if (
      message.type &&
      message.type !== 'message' &&
      message.type !== 'reaction' &&
      message.type !== Cryptos.ADM
    ) {
      const localTransaction = chat.messages.find(
        (localTransaction) => localTransaction.hash === message.hash
      )
      if (localTransaction) return
    }

    // use unshift when loading chat history
    if (unshift) {
      chat.messages.unshift(message)
    } else {
      chat.messages.push(message)
    }

    // If this is a new message, increment `numOfNewMessages`.
    // Exception only when `height = 0`, this means that the
    // user cleared `localStorage` or logged in first time.
    if (
      (message.height === undefined || // unconfirmed transaction (socket)
        (message.height > state.lastMessageHeight && state.lastMessageHeight > 0)) &&
      !isStringEqualCI(userId, message.senderId) // do not notify yourself when send message from other device
    ) {
      chat.numOfNewMessages += 1
    }
  },

  /**
   * Mark messages of specific chat as read.
   * @param {string} partnerId
   */
  markAsRead(state, partnerId) {
    const chat = state.chats[partnerId]

    if (chat) {
      chat.numOfNewMessages = 0
    }
  },

  /**
   * Marks all chats as read.
   */
  markAllAsRead(state) {
    const senderIds = Object.keys(state.chats)

    senderIds.forEach((senderId) => {
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
  updateMessage(state, { partnerId, id, realId, status, asset }) {
    const chat = state.chats[partnerId]

    if (chat) {
      const message = chat.messages.find((message) => message.id === id)

      if (message) {
        if (realId) {
          message.id = realId
        }
        if (status) {
          message.status = status
        }
        if (asset) {
          message.asset = asset
        }
      }
    }
  },

  /**
   * Add `Welcome to ADAMANT` & `ADAMANT Tokens` to state.chats.
   */
  createAdamantChats(state) {
    const chats = generateAdamantChats()

    Object.entries(chats).forEach(([senderId, chat]) => {
      state.chats[senderId] = chat
    })
  },

  updateScrollPosition(state, { contactId, scrollPosition }) {
    const chat = state.chats[contactId]

    if (chat) {
      chat.scrollPosition = scrollPosition
    }
  },

  setNoActiveNodesDialog(state, { value, afterSendingMessage = false }) {
    if (state.noActiveNodesDialog === false && !afterSendingMessage) {
      return // do not show dialog again
    }

    state.noActiveNodesDialog = value
  },

  addPendingMessage(state, { messageId, recipientId, timeout, type, files }) {
    state.pendingMessages[messageId] = {
      recipientId,
      timeout,
      type,
      files
    }
  },

  deletePendingMessage(state, messageId) {
    if (state.pendingMessages[messageId]) {
      clearTimeout(state.pendingMessages[messageId].timeout)
      delete state.pendingMessages[messageId]
    }
  },

  reset(state) {
    state.chats = {}
    state.lastMessageHeight = 0
    state.isFulfilled = false
    state.offset = 0
    state.noActiveNodesDialog = undefined
    state.newChats = {}
    state.chatsActualUntil = 0
  }
}

const actions = {
  /**
   * Get chat rooms.
   *
   * Important:
   *  - Must be called once during initialization.
   *
   * @returns {Promise}
   */
  loadChats({ commit, dispatch, rootState }, { perPage = 25 } = {}) {
    commit('setFulfilled', false)

    return admApi
      .getChatRooms(rootState.address)
      .then((result) => {
        const { messages, lastMessageHeight } = result

        dispatch('pushMessages', messages)

        if (lastMessageHeight > 0) {
          commit('setHeight', lastMessageHeight)
          commit('setOffset', perPage)
        }

        commit('setFulfilled', true)
      })
      .catch((err) => {
        if (isAllNodesDisabledError(err) || getters.isNoNodesDialogAllowed(err)) {
          commit('setNoActiveNodesDialog', { value: true })
          setTimeout(() => dispatch('loadChats'), 5000) // retry in 5 seconds
        }
      })
  },

  loadChatsPaged({ commit, dispatch, rootState, state }, { perPage = 25 } = {}) {
    const offset = state.offset

    if (offset === -1) {
      return Promise.reject(new Error('No more chats'))
    }

    return admApi
      .getChatRooms(rootState.address, { offset, limit: perPage })
      .then(({ messages }) => {
        dispatch('pushMessages', messages)

        if (messages.length <= 0) {
          commit('setOffset', -1)
        } else {
          commit('setOffset', offset + perPage)
        }
      })
  },

  /**
   * Get chat room messages.
   *
   * @param {string} contactId Adamant address
   * @param {number} perPage Messages per page
   * @returns {Promise}
   */
  getChatRoomMessages({ rootState, dispatch, commit, getters }, { contactId, perPage = 25 } = {}) {
    let offset = getters.chatOffset(contactId)
    let page = getters.chatPage(contactId)

    if (offset === -1) {
      return Promise.reject(new Error('No more messages'))
    }

    return admApi
      .getChatRoomMessages(rootState.address, contactId, { offset, limit: perPage }, true)
      .then(({ messages, lastOffset }) => {
        dispatch('unshiftMessages', messages)

        if (messages.length <= 0) {
          commit('setChatOffset', { contactId, offset: -1 }) // no more messages
        } else {
          offset = lastOffset

          commit('setChatOffset', { contactId, offset })
          commit('setChatPage', { contactId, page: ++page })
        }
      })
      .catch((err) => {
        if (isAllNodesDisabledError(err) || getters.isNoNodesDialogAllowed(err)) {
          commit('setNoActiveNodesDialog', { value: true })
        }
        throw err
      })
  },

  /**
   * Push array of messages and sort by senderId.
   * @param {Message[]} messages Array of messages
   */
  pushMessages({ commit, rootState, dispatch }, messages) {
    const normalizedMessages = messages.map(normalizeMessage)
    dispatch('botCommands/reInitCommands', normalizedMessages, { root: true })
    normalizedMessages.forEach((message) => {
      const { recipientId, senderId } = message

      if (recipientId === rootState.address || senderId === rootState.address) {
        commit('pushMessage', {
          message: message,
          userId: rootState.address
        })
      }
    })
  },

  unshiftMessages({ commit, rootState, dispatch }, messages) {
    const normalizedMessages = messages.map(normalizeMessage)
    dispatch('botCommands/reInitCommands', normalizedMessages, { root: true })
    normalizedMessages.forEach((message) => {
      commit('pushMessage', {
        message: message,
        userId: rootState.address,

        unshift: true
      })
    })
  },

  /**
   * Request for new messages.
   * This is a temporary solution until the sockets are implemented.
   * @returns {Promise}
   */
  getNewMessages({ getters, state, commit, dispatch }) {
    if (!state.isFulfilled) {
      return Promise.reject(new Error('Chat is not fulfilled'))
    }

    return getChats(state.lastMessageHeight).then((result) => {
      const { messages, lastMessageHeight, nodeTimestamp } = result
      const chatsActualInterval = getters.chatsPollingTimeout

      dispatch('pushMessages', messages)

      const validUntil =
        adamant.toTimestamp(nodeTimestamp) + chatsActualInterval + CHAT_ACTUALITY_BUFFER_MS

      commit('setChatsActualUntil', validUntil)

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
  createChat({ commit }, { partnerId, partnerName = '' }) {
    if (!validateAddress('ADM', partnerId)) {
      return Promise.reject(new Error('Invalid user address'))
    }

    return admApi
      .getPublicKey(partnerId)
      .then((key) => {
        // @todo this check must be performed on the server and return error 400 instead of 200
        if (!key) {
          throw new Error('Account not found')
        }

        return key
      })
      .then((key) => {
        // set partner name if provided
        if (partnerName) {
          commit(
            'partners/displayName',
            {
              partner: partnerId,
              displayName: partnerName
            },
            { root: true }
          )
        }

        commit('createEmptyChat', partnerId)
        commit('removeNewChat', partnerId)

        return key
      })
  },

  /**
   * Adds a message to the chat, and sends it to the server.
   * After confirmation, `id` and `status` will be updated.
   *
   * @param {string} message
   * @param {string} recipientId
   * @param {string} replyToId Optional
   * @returns {Promise}
   */
  async sendMessage({ commit, rootState, dispatch }, { message, recipientId, replyToId }) {
    let id
    try {
      const type = replyToId
        ? MessageType.RICH_CONTENT_MESSAGE
        : MessageType.BASIC_ENCRYPTED_MESSAGE

      const messageAsset = replyToId
        ? replyMessageAsset({
            replyToId,
            replyMessage: message
          })
        : message

      const signedTransaction = admApi.signChatMessageTransaction({
        to: recipientId,
        message: messageAsset,
        type
      })

      id = adamant.getTransactionId(signedTransaction)

      const messageObject = createMessage({
        id,
        message,
        recipientId,
        senderId: rootState.address,
        replyToId
      })

      commit('pushMessage', {
        message: messageObject,
        userId: rootState.address
      })

      const transaction = await queueSignedMessage(signedTransaction)

      if (!transaction.success) {
        throw new Error(i18n.global.t('chats.message_rejected'))
      }

      commit('updateMessage', {
        id,
        status: TS.REGISTERED,
        partnerId: recipientId
      })
    } catch (error) {
      if (isAllNodesOfflineError(error)) {
        // if the error is caused by connection we keep the message in PENDING status
        // and try to resend it after the connection is restored

        dispatch(
          'snackbar/show',
          {
            message: i18n.global.t(`connection.offline`),
            timeout: 3000
          },
          { root: true }
        )

        // timeout for self deleting out of pending messages
        const timeout = setTimeout(() => {
          dispatch('rejectPendingMessage', {
            messageId: id,
            recipientId
          })
        }, Number(CryptosInfo.ADM.timeout.message))

        // put the message into pending messages object
        commit('addPendingMessage', {
          messageId: id,
          type: MessageType.BASIC_ENCRYPTED_MESSAGE,
          recipientId,
          timeout
        })

        commit('updateMessage', {
          id,
          status: TS.PENDING,
          partnerId: recipientId
        })
      } else {
        if (isAllNodesDisabledError(error)) {
          commit('setNoActiveNodesDialog', { value: true, afterSendingMessage: true })
        }

        if (id) {
          commit('updateMessage', {
            id,
            status: TS.REJECTED,
            partnerId: recipientId
          })
        }
      }
      throw error
    }
  },

  /**
   * Send files to the chat.
   * After confirmation, `id` and `status` will be updated.
   *
   * @param {string} message
   * @param {string} recipientId
   * @param {FileData[]} files
   * @param {string} replyToId Optional
   * @returns {Promise}
   */
  async sendAttachment(
    { commit, rootState, dispatch, rootGetters },
    { files, message, recipientId, replyToId }
  ) {
    const recipientPublicKey = await getPublicKey(recipientId)
    const senderPublicKey = await getPublicKey(rootState.address)

    let messageObject = createAttachment({
      message,
      recipientId,
      senderId: rootState.address,
      recipientPublicKey,
      senderPublicKey,
      files,
      replyToId
    })
    console.debug('Message', messageObject)

    commit('pushMessage', {
      message: messageObject,
      userId: rootState.address
    })

    const cids = files.map((file) => [file.cid, file.preview?.cid]).filter((cid) => !!cid)
    let newAsset = replyToId
      ? { replyto_id: replyToId, reply_message: attachmentAsset(files, message) }
      : attachmentAsset(files, message)
    commit('updateMessage', {
      id: messageObject.id,
      partnerId: recipientId,
      asset: newAsset
    })
    console.debug('Updated CIDs and Nonces', newAsset)

    try {
      const areAdmNodesDisabled = rootGetters['nodes/adm'].every(
        (node) => node.status === 'disabled'
      )

      if (areAdmNodesDisabled) {
        throw new AllNodesDisabledError('adm')
      }

      const uploadData = await uploadFiles(files, (progress) => {
        for (const [cid] of cids) {
          commit('attachment/setUploadProgress', { cid, progress }, { root: true })
        }
      })
      console.debug('Files uploaded', uploadData)

      // Heisenbug: After uploading an MP4 file, the CID returned by the IPFS node differs from the locally computed one.
      // So we update the CIDs one more time, just to be sure.
      newAsset = replyToId
        ? { replyto_id: replyToId, reply_message: attachmentAsset(files, message, uploadData.cids) }
        : attachmentAsset(files, message, uploadData.cids)

      commit('updateMessage', {
        id: messageObject.id,
        partnerId: recipientId,
        asset: newAsset
      })
      console.debug('Updated CIDs after upload', newAsset)
    } catch (err) {
      if (!isAllNodesOfflineError(err)) {
        if (isAllNodesDisabledError(err)) {
          commit('setNoActiveNodesDialog', { value: true, afterSendingMessage: true })
        }

        commit('updateMessage', {
          id: messageObject.id,
          status: TS.REJECTED,
          partnerId: recipientId
        })

        for (const [cid] of cids) {
          commit('attachment/resetUploadProgress', { cid }, { root: true })
        }

        throw err
      }
    }

    for (const [cid] of cids) {
      commit('attachment/resetUploadProgress', { cid }, { root: true })
    }

    return queueMessage(newAsset, recipientId, MessageType.RICH_CONTENT_MESSAGE)
      .then((res) => {
        if (isAllNodesOfflineError(res)) {
          throw new AllNodesOfflineError('adm')
        }

        if (isAllNodesDisabledError(res)) {
          throw new AllNodesDisabledError('adm')
        }

        if (!res.success) {
          throw new Error(i18n.global.t('chats.message_rejected'))
        }

        // update `message.status` to 'REGISTERED'
        // and `message.id` with `realId` from server
        commit('updateMessage', {
          id: messageObject.id,
          realId: res.transactionId,
          status: TS.REGISTERED, // not confirmed yet, wait to be stored in the blockchain (optional line)
          partnerId: recipientId
        })

        return res
      })
      .catch((err) => {
        // update `message.status` to 'REJECTED' if the error is not caused by connection
        if (!isAllNodesOfflineError(err)) {
          if (isAllNodesDisabledError(err)) {
            commit('setNoActiveNodesDialog', { value: true, afterSendingMessage: true })
          }

          commit('updateMessage', {
            id: messageObject.id,
            status: TS.REJECTED,
            partnerId: recipientId
          })
        } else {
          // if the error is caused by connection we keep the message in PENDING status
          // and try to resend it after the connection is restored

          dispatch(
            'snackbar/show',
            {
              message: i18n.global.t(`connection.offline`),
              timeout: 3000
            },
            { root: true }
          )

          // timeout for self deleting out of pending messages
          const timeout = setTimeout(() => {
            dispatch('rejectPendingMessage', {
              messageId: messageObject.id,
              recipientId
            })
          }, Number(CryptosInfo.ADM.timeout.attachment))

          // put the message into pending messages object
          commit('addPendingMessage', {
            messageId: messageObject.id,
            type: MessageType.RICH_CONTENT_MESSAGE,
            recipientId,
            timeout,
            files
          })

          commit('updateMessage', {
            id: messageObject.id,
            status: TS.PENDING,
            partnerId: recipientId
          })
        }

        throw err // call the error again so that it can be processed inside view
      })
  },

  /**
   * Resend message, in case the connection fails.
   * @param {string} id Recipient Id
   * @param {number} id Message Id
   * @returns {Promise}
   */
  resendMessage({ getters, commit, dispatch }, { recipientId, messageId }) {
    const message = getters.partnerMessageById(recipientId, messageId)

    // update message status from `rejected` to `sent`
    // and then resendMessage
    commit('updateMessage', {
      id: messageId,
      status: TS.PENDING,
      partnerId: recipientId
    })

    if (message) {
      const type = message.isReply
        ? MessageType.RICH_CONTENT_MESSAGE
        : MessageType.BASIC_ENCRYPTED_MESSAGE
      const messageAsset = message.isReply
        ? {
            replyto_id: message.asset.replyto_id,
            reply_message: message.message
          }
        : message.message

      return queueMessage(messageAsset, recipientId, type)
        .then((res) => {
          if (!res.success) {
            throw new Error(i18n.global.t('chats.message_rejected'))
          }

          dispatch('registerPendingMessage', {
            transactionId: res.transactionId,
            messageId,
            recipientId
          })

          return res
        })
        .catch((error) => {
          if (!isAllNodesOfflineError(error)) {
            dispatch('rejectPendingMessage', {
              messageId,
              recipientId
            })
          }

          throw error
        })
    }

    return Promise.reject(new Error('Message not found in history'))
  },

  /**
   * Resend attachment, in case the connection fails at upload or at send.
   * @param {string} recipientId
   * @param {number} messageId
   * @param {FileData[]} files
   * @returns {Promise}
   */
  async resendAttachment({ getters, commit, dispatch }, { recipientId, messageId, files }) {
    const message = getters.partnerMessageById(recipientId, messageId)
    if (!message) {
      return Promise.reject(new Error('Message not found in history'))
    }

    // in case the files were not fully uploaded or uploaded incorrectly we
    // reupload them from scratch to resend a message with attachments
    const cidsOld = files.map((file) => [file.cid, file.preview?.cid]).filter(Boolean)
    for (const [cid] of cidsOld) {
      commit('attachment/resetUploadProgress', { cid }, { root: true })
    }
    commit('updateMessage', {
      id: messageId,
      status: TS.PENDING,
      partnerId: recipientId
    })

    let uploadData
    try {
      uploadData = await uploadFiles(files, (progress) => {
        for (const [cid] of cidsOld) {
          commit('attachment/setUploadProgress', { cid, progress }, { root: true })
        }
      })
    } catch (err) {
      for (const [cid] of cidsOld) {
        commit('attachment/resetUploadProgress', { cid }, { root: true })
      }

      if (!isAllNodesOfflineError(err)) {
        dispatch('rejectPendingMessage', {
          messageId,
          recipientId
        })

        throw err
      }
    }

    const newAsset = message.isReply
      ? {
          replyto_id: message.asset.replyto_id,
          reply_message: attachmentAsset(files, message.message, uploadData.cids)
        }
      : attachmentAsset(files, message.message, uploadData.cids)

    commit('updateMessage', {
      id: messageId,
      asset: newAsset,
      partnerId: recipientId
    })

    for (const [cid] of cidsOld) {
      commit('attachment/resetUploadProgress', { cid }, { root: true })
    }

    return queueMessage(newAsset, recipientId, MessageType.RICH_CONTENT_MESSAGE)
      .then((res) => {
        if (!res.success) {
          throw new Error(i18n.global.t('chats.message_rejected'))
        }
        dispatch('registerPendingMessage', {
          transactionId: res.transactionId,
          messageId,
          recipientId
        })
        return res
      })
      .catch((err) => {
        if (!isAllNodesOfflineError(err)) {
          dispatch('rejectPendingMessage', {
            messageId,
            recipientId
          })
        }

        throw err
      })
  },

  registerPendingMessage({ commit }, { messageId, recipientId, transactionId }) {
    commit('updateMessage', {
      id: messageId,
      realId: transactionId,
      status: TS.REGISTERED,
      partnerId: recipientId
    })

    commit('deletePendingMessage', messageId)
  },

  rejectPendingMessage({ commit }, { messageId, recipientId }) {
    commit('updateMessage', {
      id: messageId,
      status: TS.REJECTED,
      partnerId: recipientId
    })

    commit('deletePendingMessage', messageId)
  },

  /**
   * React to a message with emoji.
   * After confirmation, `id` and `status` will be updated.
   *
   * @param {string} recipientId
   * @param {string} reactToId
   * @param {string} reactMessage Emoji
   * @returns {Promise}
   */
  sendReaction({ commit, rootState }, { recipientId, reactToId, reactMessage }) {
    const messageObject = createReaction({
      recipientId,
      senderId: rootState.address,
      reactToId,
      reactMessage
    })

    commit('pushMessage', {
      message: messageObject,
      userId: rootState.address
    })

    const type = MessageType.RICH_CONTENT_MESSAGE
    return queueMessage(messageObject.asset, recipientId, type)
      .then((res) => {
        // @todo this check must be performed on the server
        if (!res.success) {
          throw new Error(i18n.global.t('chats.message_rejected'))
        }

        // update `message.status` to 'REGISTERED'
        // and `message.id` with `realId` from server
        commit('updateMessage', {
          id: messageObject.id,
          realId: res.transactionId,
          status: TS.REGISTERED, // not confirmed yet, wait to be stored in the blockchain (optional line)
          partnerId: recipientId
        })

        return res
      })
      .catch((err) => {
        // update `message.status` to 'REJECTED'
        commit('updateMessage', {
          id: messageObject.id,
          status: TS.REJECTED,
          partnerId: recipientId
        })

        throw err // call the error again so that it can be processed inside view
      })
  },

  /**
   * Fast crypto-transfer, to display transaction in chat
   * before confirmation.
   * @param {number} transactionId
   * @param {string} recipientId
   * @param {string} type ADM, ETH...
   * @param {string} status Can be: `sent`, `confirmed`, 'REJECTED'
   * @param {number} amount
   * @param {string} hash Transaction hash
   * @param {string} comment Transaction comment
   * @returns {number} Transaction ID
   */
  pushTransaction({ commit, rootState }, payload) {
    const {
      transactionId,
      recipientId,
      type,
      status,
      amount,
      hash,
      comment = '',
      replyToId
    } = payload

    const transactionObject = createTransaction({
      transactionId,
      recipientId,
      type,
      status,
      amount,
      hash,
      comment,
      senderId: rootState.address,
      replyToId
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

  startInterval: {
    root: true,
    handler({ dispatch, getters }) {
      function repeat() {
        dispatch('getNewMessages')
          .catch((err) => console.error(err))
          .then(() => {
            const timeout = getters.chatsPollingTimeout
            interval = setTimeout(repeat, timeout)
          })
      }

      repeat()
    }
  },

  stopInterval: {
    root: true,
    handler() {
      clearTimeout(interval)
    }
  },

  /** Resets module state **/
  reset: {
    root: true,
    handler({ commit }) {
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
