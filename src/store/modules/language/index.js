import i18n from '@/i18n'

const state = () => ({
  currentLocale: 'en',
  locales: ['it', 'de', 'en', 'fr', 'ru']
})

const mutations = {
  changeLocale (state, locale) {
    const newLocale = state.locales.find(value => value === locale)

    if (newLocale) {
      state.currentLocale = newLocale
      i18n.locale = newLocale
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
