import Vue from 'vue'
import VueI18n from 'vue-i18n'

import de from './i18n/de'
import en from './i18n/en'
import fr from './i18n/fr'
import it from './i18n/it'
import ru from './i18n/ru'

Vue.use(VueI18n)

function loadLocaleMessages () {
  return {
    de, en, fr, it, ru
  }
}

export default new VueI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'en',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  messages: loadLocaleMessages(),
  fallbackRoot: true,
  silentTranslationWarn: true
})
