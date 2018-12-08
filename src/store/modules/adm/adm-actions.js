import * as admApi from '../../../lib/adamant-api'
import i18n from '../../../i18n'
import Vue from 'vue'
import utils from '../../../lib/adamant'

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
        let chats = context.rootGetters.getChats
        let targetChat
        response.transactions.forEach(tx => {
          if (tx.recipientId === context.rootGetters.getAdmAddress) {
            targetChat = Object.values(chats).filter(chat => chat.partner === tx.senderId)
            if (targetChat && targetChat[0] && targetChat[0].partner) {
              if (!context.rootState.newChats && context.rootState.newChats[targetChat[0].partner]) {
                Vue.set(context.rootState.newChats, targetChat[0].partner, 1)
                if (context.rootState.notifySound) {
                  try {
                    window.audio.playSound('newMessageNotification')
                  } catch (e) {
                  }
                }
                context.rootState.totalNewChats = context.rootState.totalNewChats + 1
              } else {
                let newMessages = context.rootState.newChats[targetChat[0].partner]
                if (!newMessages) {
                  newMessages = 0
                }
                if (context.rootState.notifySound) {
                  try {
                    window.audio.playSound('newMessageNotification')
                  } catch (e) {
                  }
                }
                Vue.set(context.rootState.newChats, targetChat[0].partner, newMessages + 1)
                context.rootState.totalNewChats = context.rootState.totalNewChats + 1
              }
            }
          } else {
            targetChat = Object.values(chats).filter(chat => chat.partner === tx.recipientId)
            if (targetChat.length > 0 && targetChat[0].messages[tx.id]) {
              Vue.set(targetChat[0].messages[tx.id], 'confirm_class', 'confirmed')
            }
          }
          // Update last chat message
          Vue.set(targetChat, 'last_message', {
            ...targetChat.last_message,
            message: i18n.t('chats.' + (tx.recipientId === context.rootGetters.getAdmAddress ? 'received_label' : 'sent_label')) + ' ' + tx.amount / 100000000 + ' ADM',
            confirm_class: 'confirmed',
            timestamp: utils.epochTime()
          })
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
