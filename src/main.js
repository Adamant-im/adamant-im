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
import VueQRCodeComponent from 'vue-qrcode-component'
import VueHazeServerApi from './lib/adamantServerApi'
import VueFormatters from './lib/formatters'
import 'vue-material/dist/vue-material.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import packageJSON from '../package.json'
import storeConfig from './store'

Vue.use(Vuex)
Vue.use(VueMaterial)
Vue.use(VueResource)
Vue.use(VueClipboards)
Vue.use(VueI18n)
Vue.use(VueHazeServerApi)
Vue.use(VueFormatters)
Vue.component('qr-code', VueQRCodeComponent)

Vue.config.productionTip = false

var messages = require('./i18n').default

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

const store = new Vuex.Store(storeConfig)

var i18n = new VueI18n({
  locale: store.state.language, // set locale
  messages // set locale messages
})

document.title = i18n.t('app_title')

/* eslint-disable no-new */
window.ep = new Vue({
  el: '#app',
  version: packageJSON.version,
  router,
  store,
  template: '<App/>',
  components: { App },
  i18n: i18n
})
