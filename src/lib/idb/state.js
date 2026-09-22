import merge from 'deepmerge'
import Modules from './stores/Modules'
import Chats from './stores/Chats'
import Security from './stores/Security'
import { Cryptos } from '@/lib/constants'
import { cloneState } from '@/lib/cloneState'
import { logger } from '@/utils/devTools/logger'

/** Modules that will be stored in IDB **/
const modules = ['adm', 'eth', 'doge', 'bnb', 'dash', 'usds', 'res', 'partners', 'delegates']

/** Data of states and fields that must not be saved **/
/** noActiveNodesDialog - we need it to be reinitialized with default value in order to gain proper work **/
const notSavedStates = {
  chat: ['noActiveNodesDialog']
}

function cloneModuleState(moduleName, value) {
  try {
    return cloneState(value)
  } catch (error) {
    logger.error(
      'idb-state',
      `Failed to clone "${moduleName}" module for IndexedDB persistence`,
      error
    )
    throw error
  }
}

/**
 * What a module looks like in IndexedDB.
 *
 * The transactions of a crypto module are not persisted, so neither is what only
 * holds relative to them. `bottomReached` says the oldest of those transactions
 * has been loaded; kept on its own it survives a restart with an empty list and
 * stops older history from ever loading again. Height boundaries are reset by the
 * modules themselves, which detect the emptied list through `transactionsCount`.
 *
 * @param {string} name module name
 * @param {object} value module state
 * @returns {object}
 */
export function toPersistedModule(name, value) {
  const module = { ...value }

  if (Cryptos[name.toUpperCase()]) {
    module.transactions = {}

    if ('bottomReached' in module) {
      module.bottomReached = false
    }
    if ('oldTxState' in module) {
      module.oldTxState = null
    }
    if ('newTxCatchUp' in module) {
      module.newTxCatchUp = null
    }
    if ('historySession' in module) {
      module.historySession = null
    }
  }

  return module
}

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
      modulesToStore.push({
        name: moduleName,
        value: toPersistedModule(moduleName, state[moduleName])
      })
    }
  })

  // clone `chat` module, except `chats` key
  if (state.chat) {
    const chat = cloneModuleState('chat', state.chat)
    notSavedStates.chat.forEach((field) => {
      delete chat[field]
    })
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
async function saveState(store) {
  const modules = cloneModules(store.state)
  const chats = cloneChats(store.state)
  const security = cloneSecurity(store.state)

  await Promise.all([Modules.saveAll(modules), Chats.saveAll(chats), Security.saveAll(security)])

  // start Vuex => IDB sync
  store.commit('setIDBReady', true)
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
