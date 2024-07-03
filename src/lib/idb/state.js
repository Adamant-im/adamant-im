import cloneDeep from 'lodash/cloneDeep'
import merge from 'deepmerge'
import Modules from './stores/Modules'
import Chats from './stores/Chats'
import Security from './stores/Security'
import { Cryptos } from '@/lib/constants'

/** Modules that will be stored in IDB **/
const modules = ['adm', 'eth', 'doge', 'kly', 'bnb', 'dash', 'usds', 'res', 'partners', 'delegates']

/**
 * Clone modules from state.
 * @param state
 * @returns {Array<{ name: string, value: string }>}
 */
function cloneModules(state) {
  const modulesToStore = []

  // clone all modules
  modules.forEach((moduleName) => {
    if (state[moduleName]) {
      const module = { ...state[moduleName] }

      if (Cryptos[moduleName.toUpperCase()]) {
        module.transactions = {}
      }

      modulesToStore.push({
        name: moduleName,
        value: module
      })
    }
  })

  // clone `chat` module, except `chats` key
  if (state.chat) {
    const chat = cloneDeep(state.chat)
    delete chat.chats

    modulesToStore.push({
      name: 'chat',
      value: chat
    })
  }

  return modulesToStore
}

/**
 * Clone state.chat.chats and split into transactions.
 * @param state
 * @returns {Array<{ name: string, value: string }>}
 */
function cloneChats(state) {
  const chats = []

  if (state.chat) {
    const keys = Object.keys(state.chat.chats)

    keys.forEach((key) => {
      chats.push({
        name: key,
        value: state.chat.chats[key]
      })
    })
  }

  return chats
}

/**
 * Clone passphrase, balance, address, publicKeys.
 * @param state
 * @returns {Array<{ name: string, value: string }>}
 */
function cloneSecurity(state) {
  const security = []

  security.push({
    name: 'passphrase',
    value: state.passphrase
  })

  security.push({
    name: 'balance',
    value: state.balance
  })

  security.push({
    name: 'address',
    value: state.address
  })

  security.push({
    name: 'publicKeys',
    value: state.publicKeys
  })

  return security
}

/**
 * Save state to IDB.
 * @param store
 * @returns {Promise}
 */
function saveState(store) {
  const modules = cloneModules(store.state)
  const chats = cloneChats(store.state)
  const security = cloneSecurity(store.state)

  return Promise.all([
    Modules.saveAll(modules),
    Chats.saveAll(chats),
    Security.saveAll(security)
  ]).then(() => {
    // start Vuex => IDB sync
    store.commit('setIDBReady', true)
  })
}

/**
 * Restore state from IDB.
 * @param store
 * @returns {Promise}
 */
function restoreState(store) {
  const restoredState = {}

  const promises = Promise.all([Modules.getAll(), Chats.getAll(), Security.getAll()])

  return promises.then(([modules, chats, security]) => {
    // restore modules
    modules.forEach(({ name, value }) => {
      restoredState[name] = value
    })

    // restore chats
    restoredState.chat.chats = {} // add key chats to avoid undefined
    chats.forEach(({ name, value }) => {
      restoredState.chat.chats[name] = value
    })

    // restore security
    security.forEach(({ name, value }) => {
      restoredState[name] = value
    })

    store.replaceState(
      merge(store.state, restoredState, {
        arrayMerge: function (destinationArray, sourceArray) {
          return sourceArray
        },
        clone: true
      })
    )
  })
}

export { modules, saveState, restoreState }
