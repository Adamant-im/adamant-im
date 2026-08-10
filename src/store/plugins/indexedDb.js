import throttle from 'throttle-promise'
import { Base64 } from 'js-base64'

import { router } from '@/router'
import { Modules, Chats, Security, clearDb } from '@/lib/idb'
import { restoreState, modules } from '@/lib/idb/state'
import { Cryptos } from '@/lib/constants'
import { isStringEqualCI } from '@/lib/textHelpers'
import { logger } from '@/utils/devTools/logger'
import { loadPasswordKdfDescriptor } from '@/lib/idb/passwordKdf'
import { cloneState } from '@/lib/cloneState'

const chatModuleMutations = ['setHeight', 'setFulfilled']
const multipleChatMutations = ['markAllAsRead', 'createEmptyChat', 'createAdamantChats']
const singleChatMutations = ['pushMessage', 'markAsRead', 'updateMessage']

/**
 * @param {string} mutation
 * @returns {boolean}
 */
function isModuleMutation(mutation) {
  const split = mutation.split('/')

  if (split.length < 2) {
    return false
  }

  const [moduleName, mutationName] = split

  // should module be synchronized with the IDB?
  const isModuleInIDB = modules.includes(moduleName)
  const isChatModuleMutation = moduleName === 'chat' && chatModuleMutations.includes(mutationName)

  return isModuleInIDB || isChatModuleMutation
}

function isChatMutation(mutation) {
  const split = mutation.split('/')

  if (split.length < 2) {
    return false
  }

  return split[0] === 'chat'
}

/**
 * Create throttle wrapper for every module.
 * @returns {{[key: string]: Function}}
 */
function createThrottles() {
  const interval = 30000
  const throttles = {}

  // throttle modules
  modules.forEach((module) => {
    throttles[module] = throttle(
      ({ name, value }) => {
        const clonedValue = { ...value }

        if (Cryptos[name.toUpperCase()]) {
          clonedValue.transactions = {}
        }

        return Modules.set({ name, value: clonedValue })
      },
      1,
      interval
    )
  })

  // throttle chat module
  throttles.chat = throttle(
    ({ name, value }) => {
      const chat = cloneState(value)
      delete chat.chats

      return Modules.set({ name, value: chat })
    },
    1,
    interval
  )

  // throttle security keys
  throttles.security = throttle(
    ({ name, value }) => {
      return Security.set({ name, value })
    },
    1,
    interval
  )

  return throttles
}

async function fallBackToPassphraseLogin(store, warning) {
  logger.log('indexed-db-plugin', 'warn', warning)

  try {
    await clearDb()
  } catch (error) {
    logger.log('indexed-db-plugin', 'warn', error)
  }

  await store.dispatch('removePassword')
  store.commit('reset')
  return router.push('/')
}

export default (store) => {
  let throttles = createThrottles()
  let chatThrottles = {}
  let activePasswordHash = null

  const handlePersistenceError = (error) => {
    if (error?.name === 'AbortError') return

    logger.log('indexed-db-plugin', 'warn', error)
  }

  const persist = (promise) => {
    void promise.catch(handlePersistenceError)
  }

  const resetThrottles = () => {
    Object.values(throttles).forEach((throttled) => throttled.abort())
    Object.values(chatThrottles).forEach((throttled) => throttled.abort())

    // throttle-promise keeps its active counter after abort(), so aborted instances cannot be
    // reused. Fresh wrappers also ensure that writes queued under one account never run in a
    // later password session.
    throttles = createThrottles()
    chatThrottles = {}
  }

  const chatThrottle = (chatId) => {
    const interval = 10000

    if (!chatThrottles[chatId]) {
      chatThrottles[chatId] = throttle(
        ({ name, value }) => {
          return Chats.set({ name, value })
        },
        1,
        interval
      )
    }

    return chatThrottles[chatId]
  }

  if (store.getters['options/isLoginViaPassword']) {
    if (!loadPasswordKdfDescriptor()) {
      void fallBackToPassphraseLogin(
        store,
        'Password KDF data is missing or invalid. Fallback to Login via Passphrase.'
      )
    } else if (store.state.password) {
      restoreState(store)
        .then(() => {
          store.dispatch('unlock')
          store.commit('setIDBReady', true)
        })
        .then(() => {
          store.dispatch('rate/getAllRates')

          if (!store.state.chat.isFulfilled) {
            store.commit('chat/createAdamantChats')
            return store.dispatch('chat/loadChats')
          }
        })
        .then(() => {
          store.dispatch('startInterval')
        })
        .catch(() => {
          return fallBackToPassphraseLogin(
            store,
            'Can not decode IDB with current password. Fallback to Login via Passphrase.'
          )
        })
    }
  } else if (store.getters.isLogged) {
    // is logged with passphrase
    store.dispatch('unlock')
    store.dispatch('rate/getAllRates')
    store.commit('chat/createAdamantChats')
    store.dispatch('chat/loadChats').then(() => store.dispatch('startInterval'))

    store.dispatch('afterLogin', Base64.decode(store.state.passphrase))
  }

  store.subscribe((mutation, state) => {
    const passwordHash =
      state.IDBReady &&
      store.getters['options/isLoginViaPassword'] &&
      typeof state.password === 'string' &&
      /^[0-9a-f]{64}$/.test(state.password)
        ? state.password
        : null

    if (passwordHash !== activePasswordHash) {
      resetThrottles()
      activePasswordHash = passwordHash
    }

    // Start sync only after encrypted state and a valid key belong to the same password session.
    if (passwordHash) {
      if (isModuleMutation(mutation.type)) {
        const [moduleName] = mutation.type.split('/')

        persist(
          throttles[moduleName]({
            name: moduleName,
            value: state[moduleName]
          })
        )
      } else if (isChatMutation(mutation.type)) {
        const [, mutationName] = mutation.type.split('/')

        // if mutation affected all chats
        if (multipleChatMutations.includes(mutationName)) {
          const chats = []
          const keys = Object.keys(state.chat.chats)

          keys.forEach((key) => {
            chats.push({
              name: key,
              value: state.chat.chats[key]
            })
          })

          persist(Chats.saveAll(chats))
        } else if (singleChatMutations.includes(mutationName)) {
          // mutation affected single chat
          let chatId = ''

          switch (mutationName) {
            case 'pushMessage':
              chatId = isStringEqualCI(mutation.payload.message.senderId, mutation.payload.userId)
                ? mutation.payload.message.recipientId
                : mutation.payload.message.senderId
              break
            case 'markAsRead':
              chatId = mutation.payload
              break
            case 'updateMessage':
              chatId = mutation.payload.partnerId
              break
          }

          if (chatId) {
            const chat = state.chat.chats[chatId]

            persist(chatThrottle(chatId)({ name: chatId, value: chat }))
          }
        }
      } else if (mutation.type === 'setPublicKey') {
        persist(throttles.security({ name: 'publicKeys', value: state.publicKeys }))
      }
    }
  })
}
