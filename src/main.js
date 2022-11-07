import 'core-js/features/array/flat-map'
import { createApp } from 'vue'
import Vuetify from 'vuetify/lib'

import App from './App.vue'
import router from './router'
import store from './store'
import i18n from './i18n'
import currencyFilter from './filters/currencyAmountWithSymbol'
import numberFormatFilter from './filters/numberFormat'
import VueFormatters from './lib/formatters'
import packageJSON from '../package.json'
import { vuetify } from '@/plugins/vuetify'
import './plugins/layout'
import './plugins/scrollTo'
import './registerServiceWorker'
import '@/assets/styles/app.scss'

import 'dayjs/locale/de'
import 'dayjs/locale/en'
import 'dayjs/locale/fr'
import 'dayjs/locale/it'
import 'dayjs/locale/ru'

export const vueBus = createApp(() => {})

const app = createApp(App, {
  version: packageJSON.version,
  vuetify,
  router,
  store,
  components: { App },
  template: '<App/>',
  i18n
}).mount('#app')

app.use(Vuetify)
app.use(VueFormatters)
app.filter('currency', currencyFilter)
app.filter('numberFormat', numberFormatFilter)

window.ep = app

document.title = i18n.t('app_title')
