import throttle from 'throttle-promise'
import cloneDeep from 'lodash'

import { Modules, Chats, Security } from '@/lib/idb'
import { restoreState } from '@/lib/idb/state'
import AppInterval from '@/lib/AppInterval'
import { Base64 } from 'js-base64'

const chatModuleMutations = ['setHeight', 'setFulfilled']
const multipleChatMutations = ['markAllAsRead', 'createEmptyChat', 'createAdamantChats']
const singleChatMutations = ['pushMessage', 'markAsRead', 'updateMessage']

const modules = ['adm', 'eth', 'doge', 'bnb', 'bz', 'partners', 'delegates']

/**
 * @param {string} mutation
 * @returns {boolean}
 */
function isModuleMutation (mutation) {
  const split = mutation.split('/')

  if (split.length < 2) {
    return false
  }

  const [ moduleName, mutationName ] = split

  // should module be synchronized with the IDB?
  const isModuleInIDB = modules.includes(moduleName)
  const isChatModuleMutation = chatModuleMutations.includes(mutationName)

  return isModuleInIDB || isChatModuleMutation
}

function isChatMutation (mutation) {
  const split = mutation.split('/')

  if (split.length < 2) {
    return false
  }

  return split[0] === 'chat'
}

/**
 * Create throttle wrapper for every module.
 * @returns {Array<{[key]: Function}>}
 */
function createThrottles () {
  let interval = 30000
  let throttles = {}

  // throttle modules
  modules.forEach(module => {
    throttles[module] = throttle(({ name, value }) => {
      return Modules.set({ name, value })
    }, 1, interval)
  })

  // throttle chat module
  throttles.chat = throttle(({ name, value }) => {
    const chat = cloneDeep(value)
    delete chat.chats

    return Modules.set({ name, value: chat })
  }, 1, interval)

  // throttle security keys
  throttles.security = throttle(({ name, value }) => {
    return Security.set({ name, value })
  }, 1, interval)

  return throttles
}

const throttles = createThrottles()

export default store => {
  if (store.getters['options/isLoginViaPassword']) {
    if (store.state.password) {
      restoreState(store)
        .then(() => {
          if (!store.state.chat.isFulfilled) {
            store.commit('chat/createAdamantChats')
            return store.dispatch('chat/loadChats')
          }
        })
        .then(() => {
          store.dispatch('unlock')
          AppInterval.subscribe()
        })
        .catch(err => {
          // @todo fallback to login via passphrase
          // disable option `login via password`
          // clearDb
          // redirect to `/`
          console.error('restoreState', err)
        })
    }
  } else if (store.getters.isLogged) { // is logged with passphrase
    store.dispatch('unlock')
    store.commit('chat/createAdamantChats')
    store.dispatch('chat/loadChats')
      .then(() => AppInterval.subscribe())

    store.dispatch('afterLogin', Base64.decode(store.state.passphrase))
  }

  store.subscribe((mutation, state) => {
    // start sync if state has been saved to IDB
    if (state.IDBReady && store.getters['options/isLoginViaPassword']) {
      if (isModuleMutation(mutation.type)) {
        const [ moduleName ] = mutation.type.split('/')

        throttles[moduleName]({
          name: moduleName,
          value: state[moduleName]
        })
      } else if (isChatMutation(mutation.type)) {
        const [ , mutationName ] = mutation.type.split('/')

        // if mutation affected all chats
        if (multipleChatMutations.includes(mutationName)) {
          let chats = []
          const keys = Object.keys(state.chat.chats)

          keys.forEach(key => {
            chats.push({
              name: key,
              value: state.chat.chats[key]
            })
          })

          Chats.saveAll(chats)
        } else if (singleChatMutations.includes(mutationName)) { // mutation affected single chat
          let chatId = ''

          switch (mutationName) {
            case 'pushMessage':
              chatId = mutation.payload.message.senderId === mutation.payload.userId
                ? mutation.payload.message.recipientId
                : mutation.payload.message.senderId
              break
            case 'markAsRead': chatId = mutation.payload
              break
            case 'updateMessage': chatId = mutation.payload.partnerId
              break
          }

          if (chatId) {
            const chat = state.chat.chats[chatId]

            Chats.set({ name: chatId, value: chat })
          }
        }
      } else if (mutation.type === 'setPublicKey') {
        throttles.security({ name: 'publicKeys', value: state.publicKeys })
      }
    }
  })
}
