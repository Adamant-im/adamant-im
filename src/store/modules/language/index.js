import dayjs from 'dayjs'
import { i18n } from '@/i18n'

const locales = ['de', 'en', 'ru']

const state = () => ({
  currentLocale: 'en'
})

const mutations = {
  changeLocale (state, locale) {
    const newLocale = locales.find(value => value === locale)

    if (newLocale) {
      state.currentLocale = newLocale
      i18n.locale = newLocale
      dayjs.locale(newLocale)
    }
  }
}

const actions = {
  changeLocale ({ commit }, locale) {
    commit('changeLocale', locale)
  }
}

export default {
  state,
  mutations,
  actions,
  namespaced: true
}
