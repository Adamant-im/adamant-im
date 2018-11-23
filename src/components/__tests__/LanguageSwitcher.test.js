import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import Vuex from 'vuex'
import Vuetify from 'vuetify'

import LanguageSwitcher from '@/components/LanguageSwitcher'

Vue.use(Vuex)
Vue.use(Vuetify)

describe('LanguageSwitcher.vue', () => {
  let language = null
  let store = null

  // mockup store module
  beforeEach(() => {
    language = {
      state: {
        currentLocale: 'en',
        locales: ['ar', 'de', 'en', 'fr', 'ru']
      },
      actions: {
        changeLocale: jest.fn()
      },
      namespaced: true
    }

    store = new Vuex.Store({
      modules: {
        language
      }
    })
  })

  it('"currentLocale" should be equals with store state', () => {
    const wrapper = shallowMount(LanguageSwitcher, {
      store
    })

    expect(wrapper.vm.currentLocale).toBe(store.state.language.currentLocale)
  })

  it('"currentLanguageName" should be "English"', () => {
    const wrapper = shallowMount(LanguageSwitcher, {
      store
    })

    expect(wrapper.vm.currentLanguageName).toBe('English')
  })

  it('should update "currentLocale" when change state', () => {
    const wrapper = shallowMount(LanguageSwitcher, {
      store
    })

    language.state.currentLocale = 'ru'

    expect(wrapper.vm.currentLocale).toBe('ru')
    expect(wrapper.vm.currentLanguageName).toBe('Русский')
  })

  it('should dispatch action when modify "currentLocale" computed', () => {
    const wrapper = shallowMount(LanguageSwitcher, {
      store
    })

    wrapper.vm.currentLocale = 'ru'

    expect(language.actions.changeLocale).toHaveBeenCalled()
  })
})
