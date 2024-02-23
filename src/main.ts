import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'
import store from './store/index.js'
import { i18n } from './i18n'
import VueFormatters from './lib/formatters'
import packageJSON from '../package.json'
import { vuetify } from '@/plugins/vuetify'
import { registerGlobalComponents } from './plugins/layout'
import { longPressDirective } from '@/directives/longPress'
import '@/assets/styles/app.scss'

import 'dayjs/locale/de'
import 'dayjs/locale/en'
import 'dayjs/locale/fr'
import 'dayjs/locale/it'
import 'dayjs/locale/ru'

const app = createApp(App)

app.config.globalProperties.appVersion = packageJSON.version
const isTouchable =  'ontouchstart' in window || navigator.maxTouchPoints > 0;
const isMobileUserAgent =  navigator.userAgent.match(/Android/i)
  || navigator.userAgent.match(/webOS/i)
  || navigator.userAgent.match(/iPhone/i)
  || navigator.userAgent.match(/iPad/i)
  || navigator.userAgent.match(/iPod/i)
  || navigator.userAgent.match(/BlackBerry/i)
  || navigator.userAgent.match(/Windows Phone/i)

app.config.globalProperties.$isMobile = isTouchable && isMobileUserAgent

app.use(router)
app.use(store)
app.use(i18n)
app.use(vuetify)
app.use(VueFormatters)
app.directive('longpress', longPressDirective)

registerGlobalComponents(app)

app.mount('#app')

window.ep = app

document.title = i18n.global.t('app_title')
