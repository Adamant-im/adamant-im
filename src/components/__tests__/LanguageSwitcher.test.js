import { vi, describe, expect, beforeEach, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'

import LanguageSwitcher from '@/components/LanguageSwitcher'
import en from '@/locales/en'
import ru from '@/locales/ru'
import mockupI18n from '@/components/__tests__/__mocks__/plugins/i18n'

/**
 * Mockup store helper.
 */
function mockupStore() {
  const language = {
    state: {
      currentLocale: 'en',
      locales: ['ar', 'de', 'en', 'fr', 'ru']
    },
    actions: {
      changeLocale: vi.fn()
    },
    namespaced: true
  }

  const store = createStore({
    modules: {
      language
    }
  })

  return {
    store,
    language
  }
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
    const wrapper = mount(LanguageSwitcher, {
      shallow: true,
      global: {
        plugins: [store, i18n]
      }
    })

    expect(wrapper.vm.currentLocale).toBe(store.state.language.currentLocale)
  })

  it('"currentLanguageName" should be "English"', () => {
    const wrapper = mount(LanguageSwitcher, {
      shallow: true,
      global: {
        plugins: [store, i18n]
      }
    })

    expect(wrapper.vm.currentLanguageName).toBe('English')
  })

  it('should update "currentLocale" when change state', () => {
    const wrapper = mount(LanguageSwitcher, {
      shallow: true,
      global: {
        plugins: [store, i18n]
      }
    })

    language.state.currentLocale = 'ru'

    expect(wrapper.vm.currentLocale).toBe('ru')
    expect(wrapper.vm.currentLanguageName).toBe('Русский')
  })

  it('should dispatch action when modify "currentLocale" computed', () => {
    const wrapper = mount(LanguageSwitcher, {
      shallow: true,
      global: {
        plugins: [store, i18n]
      }
    })

    wrapper.vm.currentLocale = 'ru'

    expect(language.actions.changeLocale).toHaveBeenCalled()
  })
})
