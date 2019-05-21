import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import Vuetify from 'vuetify'

import LanguageSwitcher from '@/components/LanguageSwitcher'
import en from '@/i18n/en'
import ru from '@/i18n/ru'

Vue.use(VueI18n)
Vue.use(Vuex)
Vue.use(Vuetify)

/**
 * Mockup store helper.
 */
function mockupStore () {
  const language = {
    state: {
      currentLocale: 'en',
      locales: ['ar', 'de', 'en', 'fr', 'ru']
    },
    actions: {
      changeLocale: jest.fn()
    },
    namespaced: true
  }

  const store = new Vuex.Store({
    modules: {
      language
    }
  })

  return {
    store,
    language
  }
}

/**
 * Mockup i18n helper.
 */
function mockupI18n () {
  return new VueI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      en,
      ru
    }
  })
}

describe('LanguageSwitcher.vue', () => {
  let i18n = null

  let language = null
  let store = null

  // mockup store module
  beforeEach(() => {
    const vuex = mockupStore()

    language = vuex.language
    store = vuex.store

    i18n = mockupI18n()
  })

  it('"currentLocale" should be equals with store state', () => {
    const wrapper = shallowMount(LanguageSwitcher, {
      store,
      i18n
    })

    expect(wrapper.vm.currentLocale).toBe(store.state.language.currentLocale)
  })

  it('"currentLanguageName" should be "English"', () => {
    const wrapper = shallowMount(LanguageSwitcher, {
      store,
      i18n
    })

    expect(wrapper.vm.currentLanguageName).toBe('English')
  })

  it('should update "currentLocale" when change state', () => {
    const wrapper = shallowMount(LanguageSwitcher, {
      store,
      i18n
    })

    language.state.currentLocale = 'ru'

    expect(wrapper.vm.currentLocale).toBe('ru')
    expect(wrapper.vm.currentLanguageName).toBe('Русский')
  })

  it('should dispatch action when modify "currentLocale" computed', () => {
    const wrapper = shallowMount(LanguageSwitcher, {
      store,
      i18n
    })

    wrapper.vm.currentLocale = 'ru'

    expect(language.actions.changeLocale).toHaveBeenCalled()
  })
})
