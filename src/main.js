import 'core-js/features/array/flat-map'
import { createApp } from 'vue'
import VueScrollTo from 'vue-scrollto'

import App from './App.vue'
import { router } from './router'
import store from './store'
import { i18n } from './i18n'
import currencyFilter from './filters/currencyAmountWithSymbol'
import numberFormatFilter from './filters/numberFormat'
import VueFormatters from './lib/formatters'
import packageJSON from '../package.json'
import { vuetify } from '@/plugins/vuetify'
import { registerGlobalComponents } from './plugins/layout'
import './registerServiceWorker'
import '@/assets/styles/app.scss'

import 'dayjs/locale/de'
import 'dayjs/locale/en'
import 'dayjs/locale/fr'
import 'dayjs/locale/it'
import 'dayjs/locale/ru'

export const vueBus = createApp(() => {})

const app = createApp(App, {
  version: packageJSON.version
})

app.use(router)
app.use(store)
app.use(i18n)
app.use(vuetify)
app.use(VueFormatters)
app.use(VueScrollTo) // @todo deprecated (works only with Vue@2)
app.filter('currency', currencyFilter)
app.filter('numberFormat', numberFormatFilter)

registerGlobalComponents(app)

app.mount('#app')

window.ep = app

document.title = i18n.global.t('app_title')
