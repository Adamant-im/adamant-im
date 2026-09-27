import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'

import App from './App.vue'
import { router } from './router'
import { pinia } from '@/plugins/pinia'
import store from './store/index.js'
import { i18n } from './i18n'
import { vuetify } from '@/plugins/vuetify'
import { registerGlobalComponents } from './plugins/layout'
import { longPressDirective } from '@/directives/longPress'
import '@/assets/styles/app.scss'

import dayjs from 'dayjs'
import 'dayjs/locale/ar'
import 'dayjs/locale/de'
import 'dayjs/locale/en'
import 'dayjs/locale/es'
import 'dayjs/locale/fr'
import 'dayjs/locale/it'
import 'dayjs/locale/ja'
import 'dayjs/locale/ru'
import 'dayjs/locale/zh-cn'

if (dayjs.Ls && dayjs.Ls['zh-cn']) {
  dayjs.locale('zh', dayjs.Ls['zh-cn'])
}

const app = createApp(App)

app.use(router)
app.use(store)
app.use(pinia)
app.use(i18n)
app.use(vuetify)
app.use(VueQueryPlugin)
app.directive('longpress', longPressDirective)

registerGlobalComponents(app)

app.mount('#app')

document.title = i18n.global.t('app_title')
