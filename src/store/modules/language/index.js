import { SUPPORTED_LOCALES, detectLocale } from '@/i18n'

// A saved preference restored by `vuex-persist` replaces the detected locale.
// `App.vue` applies the current locale to vue-i18n, Vuetify, dayjs and the document.
const state = () => ({
  currentLocale: detectLocale()
})

const mutations = {
  changeLocale(state, locale) {
    if (SUPPORTED_LOCALES.includes(locale)) {
      state.currentLocale = locale
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
