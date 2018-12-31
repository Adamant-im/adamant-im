import * as admApi from '../../../lib/adamant-api'
import i18n from '../../../i18n'
import Vue from 'vue'
import router from '../../../router'
import utils from '../../../lib/adamant'

function getExistedChatWithSender (chats, senderAddress) {
  const chatListWithSender = Object.values(chats).filter(chat => chat.partner === senderAddress)
  return chatListWithSender && chatListWithSender[0] && chatListWithSender[0].partner ? chatListWithSender[0] : undefined
}

export default {

  /** Starts background sync after login */
  afterLogin: {
    root: true,
    handler (context) {
      const address = context.rootState.address
      context.commit('address', address)
    }
  },

  /** Resets module state */
  reset: {
    root: true,
    handler (context) {
      context.commit('reset')
    }
  },

  /** Handles store rehydratation */
  rehydrate: {
    root: true,
    handler (context) {
      const address = context.rootState.address
      context.commit('address', address)
    }
  },

  /**
   * Retrieves new transactions: those that follow the most recently retrieved one.
   * @param {any} context Vuex action context
   */
  getNewTransactions (context) {
    const options = { }
    if (context.state.maxHeight > 0) {
      options.from = context.state.maxHeight + 1
    }
    return admApi.getTransactions(options).then(response => {
      if (Array.isArray(response.transactions) && response.transactions.length) {
        const currentAdmAddress = context.rootGetters.getAdmAddress
        let chats = context.rootGetters.getChats
        response.transactions.forEach(tx => {
          context.dispatch('updateChatHeight', tx.height, { root: true })
          if (tx.recipientId !== currentAdmAddress) {
            // Means that transaction is not for this user. Impossible case. But nonetheless
            return
          }
          const senderId = tx.senderId
          const chatWithSender = getExistedChatWithSender(chats, senderId)
          if (!chatWithSender) {
            return
          }
          if (options.from) {
            // Mark chat as unread, if user is on another page
            if (router.currentRoute.path.indexOf(senderId) < 0) {
              let newMessages = context.rootState.newChats[chatWithSender.partner]
              if (!newMessages) {
                newMessages = 0
              }
              Vue.set(context.rootState.newChats, chatWithSender.partner, newMessages + 1)
              context.rootState.totalNewChats = context.rootState.totalNewChats + 1
              // Play notification sound
              if (context.rootState.notifySound) {
                try {
                  window.audio.playSound('newMessageNotification')
                } catch (e) {
                }
              }
            }
            // Update last chat message
            if (chatWithSender) {
              const textLabel = tx.recipientId === currentAdmAddress ? 'received_label' : 'sent_label'
              Vue.set(chatWithSender, 'last_message', {
                ...chatWithSender.last_message,
                message: i18n.t('chats.' + textLabel) + ' ' + tx.amount / 100000000 + ' ADM',
                confirm_class: 'confirmed',
                timestamp: utils.epochTime()
              })
            }
          }
        })
        context.commit('transactions', response.transactions)
      }
    })
  },

  /**
   * Retrieves new transactions: those that preceed the oldest among the retrieved ones.
   * @param {any} context Vuex action context
   */
  getOldTransactions (context) {
    // If we already have the most old transaction for this address, no need to request anything
    if (context.state.bottomReached) return Promise.resolve()

    const options = { }
    if (context.state.minHeight > 1) {
      options.to = context.state.minHeight - 1
    }

    return admApi.getTransactions(options).then(response => {
      const hasResult = Array.isArray(response.transactions) && response.transactions.length

      if (hasResult) {
        context.commit('transactions', response.transactions)
      }

      // Successful but empty response means, that the oldest transaction for the current
      // address has been received already
      if (response.success && !hasResult) {
        context.commit('bottom')
      }
    })
  },

  /**
   * Retrieves transaction info.
   * @param {any} context Vuex action context
   * @param {string} id transaction ID
   */
  getTransaction (context, id) {
    admApi.getTransaction(id).then(
      transaction => context.commit('transactions', [transaction])
    )
  }
}
