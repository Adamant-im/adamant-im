import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import VueI18n from 'vue-i18n'
import Vuetify from 'vuetify'
import PassphraseGenerator from '@/components/PassphraseGenerator'

import en from '@/i18n/en'

Vue.use(VueI18n)
Vue.use(Vuetify)

/**
 * Mockup i18n helper.
 */
function mockupI18n () {
  return new VueI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      en
    }
  })
}

describe('PassphraseGenerator.vue', () => {
  let i18n = null

  beforeEach(() => {
    i18n = mockupI18n()
  })

  it('renders the correct markup', () => {
    const wrapper = shallowMount(PassphraseGenerator, {
      i18n
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  it('check default data', () => {
    const wrapper = shallowMount(PassphraseGenerator, {
      i18n
    })

    expect(wrapper.vm.passphrase).toBe('')
    expect(wrapper.vm.showPassphrase).toBe(false)
  })

  it('should emit "copy" when copyToClipboard()', () => {
    // Mockup document.execCommand
    Object.defineProperty(document, 'execCommand', {
      value: jest.fn()
    })

    const wrapper = shallowMount(PassphraseGenerator, {
      i18n
    })

    wrapper.vm.passphrase = 'passphrase'
    wrapper.vm.copyToClipboard()

    expect(wrapper.emitted().copy).toBeTruthy()
    expect(document.execCommand).toBeCalled()
  })

  it('should emit "save" when saveFile()', () => {
    // Mockup window.URL
    Object.defineProperty(window, 'URL', {
      value: {
        createObjectURL: jest.fn()
      }
    })

    const wrapper = shallowMount(PassphraseGenerator, {
      i18n
    })

    wrapper.vm.passphrase = 'passphrase'
    wrapper.vm.saveFile()

    expect(wrapper.emitted().save).toBeTruthy()
    expect(window.URL.createObjectURL).toBeCalled()
  })

  it('should generate passphrase when generatePassphrase()', () => {
    const wrapper = shallowMount(PassphraseGenerator, {
      i18n
    })

    wrapper.vm.generatePassphrase()

    expect(wrapper.vm.showPassphrase).toBe(true)
    expect(wrapper.vm.passphrase.length > 0).toBe(true)
  })

  // @todo trigger('click') tests
})
