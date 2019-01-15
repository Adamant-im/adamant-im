import Vue from 'vue'
import Vuex from 'vuex'
import { Base64 } from 'js-base64'

import { loginOrRegister } from '@/lib/adamant-api'
import { Cryptos } from '@/lib/constants'
import sessionStoragePlugin from './plugins/sessionStorage'
import localStoragePlugin from './plugins/localStorage'
import ethModule from './modules/eth'
import erc20Module from './modules/erc20'
import contactsModule from './modules/contacts'
import admModule from './modules/adm'
import nodesModule from './modules/nodes'
import delegatesModule from './modules/delegates'
import nodesPlugin from './modules/nodes/nodes-plugin'
import snackbar from './modules/snackbar'
import language from './modules/language'
import noise from './modules/noise'
import chat from './modules/chat'
import options from './modules/options'

Vue.use(Vuex)

const store = {
  state: () => ({
    address: '',
    balance: 0,
    passphrase: '',
    publicKey: '',
    privateKey: ''
  }),
  getters: {
    isLogged: state => state.passphrase.length > 0
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
    setPublicKey (state, publicKey) {
      state.publicKey = publicKey
    },
    setPrivateKey (state, privateKey) {
      state.privateKey = privateKey
    },
    resetState (state) {
      state.address = ''
      state.balance = 0
      state.passphrase = ''
      state.publicKey = ''
      state.privateKey = ''
    }
  },
  actions: {
    /**
     * Updates current application status: balance, chat messages, transactions and so on
     * @param {any} context Vuex action context
     */
    update ({ dispatch, getters }) {
      if (getters.isLogged) {
        dispatch('chat/getNewMessages')
          .catch(() => {})
      }
    },
    login ({ commit, dispatch }, passphrase) {
      return loginOrRegister(passphrase)
        .then(account => {
          commit('setAddress', account.address)
          commit('setBalance', account.balance)
          commit('setPassphrase', passphrase)
          commit('setPublicKey', account.publicKey)
          commit('setPrivateKey', account.privateKey)

          // retrieve eth & erc20 data
          dispatch('afterLogin', passphrase)
          dispatch('contacts/fetchContacts', null, true)
        })
    },
    logout ({ commit }) {
      commit('resetState')
    }
  },
  plugins: [nodesPlugin, sessionStoragePlugin, localStoragePlugin],
  modules: {
    eth: ethModule, // Ethereum-related data
    bnb: erc20Module(Cryptos.BNB, '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', 18),
    adm: admModule, // ADM transfers
    contacts: contactsModule, // Partners: display names, crypto addresses and so on
    delegates: delegatesModule, // Voting for delegates screen
    nodes: nodesModule, // ADAMANT nodes
    snackbar,
    noise,
    language,
    chat,
    options
  }
}

export { store } // for tests

export default new Vuex.Store(store)
