import Vue from 'vue'
import Vuex from 'vuex'
import { Base64 } from 'js-base64'

import { unlock, loginOrRegister, storeCryptoAddress } from '@/lib/adamant-api'
import { Cryptos } from '@/lib/constants'
import sessionStoragePlugin from './plugins/sessionStorage'
import localStoragePlugin from './plugins/localStorage'
import ethModule from './modules/eth'
import erc20Module from './modules/erc20'
import partnersModule from './modules/partners'
import admModule from './modules/adm'
import dogeModule from './modules/doge'
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
    passphrase: ''
  }),
  getters: {
    isLogged: state => state.passphrase.length > 0,
    getPassPhrase: state => state.passphrase // compatibility getter for ERC20 modules
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
    reset (state) {
      state.address = ''
      state.balance = 0
      state.passphrase = ''
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

          // retrieve eth & erc20 data
          dispatch('afterLogin', passphrase)
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
    /** Stores user address for the specified crypto in the ADM KVS */
    storeCryptoAddress ({ state }, { crypto, address }) {
      return storeCryptoAddress(crypto, address)
    },
    reset ({ commit }) {
      commit('reset', null, { root: true })
    }
  },
  plugins: [nodesPlugin, sessionStoragePlugin, localStoragePlugin],
  modules: {
    eth: ethModule, // Ethereum-related data
    bnb: erc20Module(Cryptos.BNB, '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', 18),
    bz: erc20Module(Cryptos.BZ, '0x4375e7ad8a01b8ec3ed041399f62d9cd120e0063', 18),
    adm: admModule, // ADM transfers
    doge: dogeModule,
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
