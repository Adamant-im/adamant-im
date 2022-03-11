import Vue from 'vue'
import Vuex from 'vuex'
import { Base64 } from 'js-base64'

import {
  unlock,
  loginOrRegister,
  loginViaPassword,
  sendSpecialMessage,
  getCurrentAccount
} from '@/lib/adamant-api'
import { Cryptos, Fees } from '@/lib/constants'
import { encryptPassword } from '@/lib/idb/crypto'
import { flushCryptoAddresses, validateStoredCryptoAddresses } from '@/lib/store-crypto-address'
import sessionStoragePlugin from './plugins/sessionStorage'
import localStoragePlugin from './plugins/localStorage'
import indexedDbPlugin from './plugins/indexedDb'
import navigatorOnline from './plugins/navigatorOnline'
import socketsPlugin from './plugins/socketsPlugin'
import ethModule from './modules/eth'
import erc20Module from './modules/erc20'
import partnersModule from './modules/partners'
import admModule from './modules/adm'
import dogeModule from './modules/doge'
import lskModule from './modules/lsk'
import dashModule from './modules/dash'
import bitcoinModule from './modules/btc'
import nodesModule from './modules/nodes'
import delegatesModule from './modules/delegates'
import nodesPlugin from './modules/nodes/nodes-plugin'
import snackbar from './modules/snackbar'
import language from './modules/language'
import chat from './modules/chat'
import options from './modules/options'
import identicon from './modules/identicon'
import notification from './modules/notification'
import cache from '@/store/cache'
import rate from './modules/rate'

Vue.use(Vuex)

export let interval

const UPDATE_BALANCE_INTERVAL = 10000
const UPDATE_RATE_INTERVAL = 10000

const store = {
  state: () => ({
    address: '',
    balance: 0,
    passphrase: '',
    password: '',
    IDBReady: false, // set `true` when state has been saved in IDB
    publicKeys: {}
  }),
  getters: {
    isLogged: state => state.passphrase.length > 0,
    getPassPhrase: state => state.passphrase, // compatibility getter for ERC20 modules
    publicKey: state => adamantAddress => state.publicKeys[adamantAddress],
    isAccountNew: state => function () {
      /*
        It is hard to detect if account is new or not. Let's say:
        ADM Balance = 0. But old accounts can also have 0 balance
        ADM transactions count = 0. But any account has 0 transactions in store just after login, before user goes to Tx list screen
        chat.lastMessageHeight = 0. App stores a height of last message
        Checking chat.transactions is not effective. There are static chats in any new account.
      */
      return state.balance === 0 &&
        state.chat.lastMessageHeight === 0 &&
        Object.keys(state.adm.transactions).length === 0
    }
  },
  mutations: {
    setAddress (state, address) {
      state.address = address
    },
    setBalance (state, balance) {
      state.balance = balance
    },
    setPassphrase (state, passphrase) {
      state.passphrase = Base64.encode(passphrase)
    },
    setPassword (state, password) {
      state.password = password
    },
    resetPassword (state) {
      state.password = ''
    },
    setIDBReady (state, value) {
      state.IDBReady = value
    },
    reset (state) {
      state.address = ''
      state.balance = 0
      state.passphrase = ''
      state.password = ''
      state.IDBReady = false
      state.publicKeys = {}
      cache.resetCachedSeed()
    },
    setPublicKey (state, { adamantAddress, publicKey }) {
      state.publicKeys[adamantAddress] = publicKey
    }
  },
  actions: {
    login ({ commit, dispatch }, passphrase) {
      // First, clear previous account data, if it exists. Calls resetState(state, getInitialState()) also
      dispatch('reset')

      return loginOrRegister(passphrase)
        .then(account => {
          commit('setAddress', account.address)
          commit('setBalance', account.balance)
          commit('setPassphrase', passphrase)

          // retrieve wallet data
          dispatch('afterLogin', passphrase)
        })
    },
    loginViaPassword ({ commit, dispatch, state }, password) {
      return loginViaPassword(password, this)
        .then(account => {
          commit('setIDBReady', true)

          // retrieve wallet data
          dispatch('afterLogin', account.passphrase)
        })
    },
    logout ({ dispatch }) {
      dispatch('reset')
    },
    unlock ({ state, dispatch }) {
      // user updated an app, F5 or something
      const passphrase = Base64.decode(state.passphrase)

      unlock(passphrase)

      // retrieve wallet data only if loginViaPassword, otherwise coin modules will be loaded twice
      if (state.password) {
        dispatch('afterLogin', passphrase)
      }
    },
    sendCryptoTransferMessage (context, payload) {
      const msg = {
        type: `${payload.crypto}_transaction`,
        amount: payload.amount,
        hash: payload.hash,
        comments: payload.comments
      }

      return sendSpecialMessage(payload.address, msg).then(result => {
        if (!result.success) {
          throw new Error(`Failed to send "${msg.type}"`)
        }
        return result.success
      })
    },
    reset ({ commit }) {
      commit('reset', null, { root: true })
    },
    setPassword ({ commit }, password) {
      return encryptPassword(password)
        .then(encryptedPassword => {
          commit('setPassword', encryptedPassword)

          return encryptedPassword
        })
    },
    removePassword ({ commit }) {
      commit('resetPassword')
      commit('setIDBReady', false)
      commit('options/updateOption', { key: 'stayLoggedIn', value: false })
    },
    updateBalance ({ commit }) {
      return getCurrentAccount()
        .then(account => {
          commit('setBalance', account.balance)
          if (account.balance > Fees.KVS) {
            flushCryptoAddresses()
          }
        })
    },

    startInterval: {
      root: true,
      handler ({ dispatch }) {
        function repeat () {
          validateStoredCryptoAddresses()
          dispatch('rate/getAllRates').catch(err => console.error(err))
            .then(() => (interval = setTimeout(repeat, UPDATE_RATE_INTERVAL)))
          dispatch('updateBalance')
            .catch(err => console.error(err))
            .then(() => (interval = setTimeout(repeat, UPDATE_BALANCE_INTERVAL)))
        }

        repeat()
      }
    },

    stopInterval: {
      root: true,
      handler () {
        clearTimeout(interval)
      }
    }
  },
  plugins: [nodesPlugin, sessionStoragePlugin, localStoragePlugin, indexedDbPlugin, navigatorOnline, socketsPlugin],
  modules: {
    eth: ethModule, // Ethereum-related data
    bnb: erc20Module(Cryptos.BNB, '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', 18),
    usds: erc20Module(Cryptos.USDS, '0xa4bdb11dc0a2bec88d24a3aa1e6bb17201112ebe', 6),
    adm: admModule, // ADM transfers
    doge: dogeModule,
    lsk: lskModule,
    dash: dashModule,
    btc: bitcoinModule,
    partners: partnersModule, // Partners: display names, crypto addresses and so on
    delegates: delegatesModule, // Voting for delegates screen
    nodes: nodesModule, // ADAMANT nodes
    snackbar,
    language,
    chat,
    options,
    identicon,
    notification,
    rate
  }
}

export { store } // for tests

export default new Vuex.Store(store)
