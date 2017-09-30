// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import VueI18n from 'vue-i18n'
import VueResource from 'vue-resource'
import VueClipboards from 'vue-clipboards'
import Vuex from 'vuex'
import VueMaterial from 'vue-material'
import VueHazeServerApi from './lib/hazeServerApi'

import 'vue-material/dist/vue-material.css'

Vue.use(Vuex)
Vue.use(VueMaterial)
Vue.use(VueResource)
Vue.use(VueClipboards)
Vue.use(VueI18n)
Vue.use(VueHazeServerApi)

Vue.config.productionTip = false

var messages = require('./i18n').default

var i18n = new VueI18n({
  locale: 'en', // set locale
  messages // set locale messages
})

Vue.material.registerTheme({
  default: {
    primary: {
      color: 'light-green',
      hue: 700
    },
    accent: 'red'
  },
  teal: {
    primary: 'blue',
    accent: 'pink'
  },
  purple: {
    primary: 'purple',
    accent: 'orange'
  }
})

const store = new Vuex.Store({
  state: {
    address: '',
    passPhrase: '',
    connectionString: '',
    balance: 0,
    is_new_account: false,
    ajaxIsOngoing: false,
    lastErrorMsg: '',
    transactions: {}
  },
  mutations: {
    save_passphrase (state, payload) {
      state.passPhrase = payload.passPhrase
    },
    ajax_start (state) {
      state.ajaxIsOngoing = true
    },
    ajax_end (state) {
      state.ajaxIsOngoing = false
    },
    ajax_end_with_error (state) {
      state.ajaxIsOngoing = false
      state.lastErrorMsg = 'CONNECT PROBLEM'
    },
    send_error (state, payload) {
      state.lastErrorMsg = payload.msg
    },
    logout (state) {
      state.passPhrase = ''
      state.address = ''
      state.balance = 0
      state.is_new_account = false
    },
    login (state, payload) {
      state.address = payload.address
      if (payload.passPhrase) {
        state.passPhrase = payload.passPhrase
      }
      state.balance = payload.balance
      if (payload.is_new_account) {
        state.is_new_account = payload.is_new_account
      }
    },
    transaction_info (state, payload) {
      Vue.set(state.transactions, payload.id, payload)
    },
    connect (state, payload) {
      state.connectionString = payload.string
    }
  }
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App },
  i18n: i18n
})
