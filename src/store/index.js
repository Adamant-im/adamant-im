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
import { flushCryptoAddresses } from '@/lib/store-crypto-address'
import sessionStoragePlugin from './plugins/sessionStorage'
import localStoragePlugin from './plugins/localStorage'
import indexedDbPlugin from './plugins/indexedDb'
import ethModule from './modules/eth'
import erc20Module from './modules/erc20'
import partnersModule from './modules/partners'
import admModule from './modules/adm'
import dogeModule from './modules/doge'
import dashModule from './modules/dash'
import nodesModule from './modules/nodes'
import delegatesModule from './modules/delegates'
import nodesPlugin from './modules/nodes/nodes-plugin'
import snackbar from './modules/snackbar'
import language from './modules/language'
import chat from './modules/chat'
import options from './modules/options'
import identicon from './modules/identicon'

Vue.use(Vuex)

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
    publicKey: state => adamantAddress => state.publicKeys[adamantAddress]
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
    },
    setPublicKey (state, { adamantAddress, publicKey }) {
      state.publicKeys[adamantAddress] = publicKey
    }
  },
  actions: {
    login ({ commit, dispatch }, passphrase) {
      return loginOrRegister(passphrase)
        .then(account => {
          commit('setAddress', account.address)
          commit('setBalance', account.balance)
          commit('setPassphrase', passphrase)

          // retrieve eth & erc20 data
          dispatch('afterLogin', passphrase)
        })
    },
    loginViaPassword ({ commit, dispatch, state }, password) {
      return loginViaPassword(password, this)
        .then(account => {
          commit('setIDBReady', true)

          // retrieve eth & erc20 data
          dispatch('afterLogin', account.passphrase)
        })
    },
    logout ({ dispatch }) {
      dispatch('reset')
    },
    unlock ({ state, dispatch }) {
      const passphrase = Base64.decode(state.passphrase)

      unlock(passphrase)

      // retrieve eth & erc20 data
      dispatch('afterLogin', passphrase)
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
      commit('options/updateOption', { key: 'logoutOnTabClose', value: true })
    },
    updateBalance ({ commit }) {
      return getCurrentAccount()
        .then(account => {
          commit('setBalance', account.balance)

          if (account.balance > Fees.KVS) {
            flushCryptoAddresses()
          }
        })
    }
  },
  plugins: [nodesPlugin, sessionStoragePlugin, localStoragePlugin, indexedDbPlugin],
  modules: {
    eth: ethModule, // Ethereum-related data
    bnb: erc20Module(Cryptos.BNB, '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', 18),
    bz: erc20Module(Cryptos.BZ, '0x4375e7ad8a01b8ec3ed041399f62d9cd120e0063', 18),
    kcs: erc20Module(Cryptos.KCS, '0x039b5649a59967e3e936d7471f9c3700100ee1ab', 6),
    adm: admModule, // ADM transfers
    doge: dogeModule,
    dash: dashModule,
    partners: partnersModule, // Partners: display names, crypto addresses and so on
    delegates: delegatesModule, // Voting for delegates screen
    nodes: nodesModule, // ADAMANT nodes
    snackbar,
    language,
    chat,
    options,
    identicon
  }
}

export { store } // for tests

export default new Vuex.Store(store)
