import '@babel/polyfill'
import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import router from './router'
import './registerServiceWorker'
import i18n from './i18n'

import VueClipboards from 'vue-clipboards'
import VueFormatters from './lib/formatters'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import packageJSON from '../package.json'
import store from './store'
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import '@mdi/font/css/materialdesignicons.css'
import Default from './layouts/default'
import Toolbar from './layouts/toolbar'
import Chat from './layouts/chat'

Vue.use(VueClipboards)
Vue.use(VueFormatters)

// Register layouts globally
Vue.component('default', Default)
Vue.component('toolbar', Toolbar)
Vue.component('chat', Chat)

document.title = i18n.t('app_title')

Vue.config.productionTip = false

window.ep = new Vue({
  version: packageJSON.version,
  router,
  store,
  template: '<App/>',
  components: { App },
  i18n,
  render: h => h(App)
}).$mount('#app')
