import Vue from 'vue'

import App from './App.vue'
import router from './router'
import store from './store'
import i18n from './i18n'
import currencyFilter from './filters/currency'
import numberFormatFilter from './filters/numberFormat'
import VueFormatters from './lib/formatters'
import packageJSON from '../package.json'
import './plugins/vuetify'
import './plugins/layout'
import './plugins/scrollTo'
import './registerServiceWorker'
import '@/assets/stylus/app.styl'

import 'dayjs/locale/de'
import 'dayjs/locale/en'
import 'dayjs/locale/fr'
import 'dayjs/locale/it'
import 'dayjs/locale/ru'

Vue.use(VueFormatters)

document.title = i18n.t('app_title')

Vue.config.productionTip = false
Vue.filter('currency', currencyFilter)
Vue.filter('numberFormat', numberFormatFilter)

window.ep = new Vue({
  version: packageJSON.version,
  router,
  store,
  template: '<App/>',
  components: { App },
  i18n,
  render: h => h(App)
}).$mount('#app')
