import dayjs from 'dayjs'
import {
  i18n,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  normalizeLocale,
  applyLocaleToDocument
} from '@/i18n'

const state = () => ({
  currentLocale: DEFAULT_LOCALE
})

const mutations = {
  changeLocale(state, locale) {
    const normalized = normalizeLocale(locale)
    const newLocale = SUPPORTED_LOCALES.find((value) => value === normalized)

    if (newLocale) {
      state.currentLocale = newLocale
      if (typeof i18n.global.locale === 'string') {
        i18n.global.locale = newLocale
      } else if (i18n.global.locale && 'value' in i18n.global.locale) {
        i18n.global.locale.value = newLocale
      }
      const dayjsLocale = newLocale === 'zh' ? 'zh-cn' : newLocale
      dayjs.locale(dayjsLocale)
      applyLocaleToDocument(newLocale)
    }
  }
}

const actions = {
  changeLocale({ commit }, locale) {
    commit('changeLocale', locale)
  }
}

export default {
  state,
  mutations,
  actions,
  namespaced: true
}
