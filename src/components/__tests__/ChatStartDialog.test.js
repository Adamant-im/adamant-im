import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import Vuetify from 'vuetify'

import en from '@/i18n/en'
import ChatStartDialog from '@/components/ChatStartDialog'

Vue.use(Vuex)
Vue.use(VueI18n)
Vue.use(Vuetify)

/**
 * Mockup store helper.
 */
function mockupStore () {
  const snackbar = {
    state: {
      show: false,
      message: '',
      timeout: 1500,
      color: ''
    },
    mutations: {
      changeState: jest.fn(),
      resetOptions: jest.fn()
    },
    actions: {
      show: jest.fn()
    },
    namespaced: true
  }

  const store = new Vuex.Store({
    modules: {
      snackbar
    }
  })

  return {
    store,
    snackbar
  }
}

/**
 * Mockup i18n helper.
 */
function mockupI18n () {
  return new VueI18n({
    locale: 'en',
    fallbackLocale: 'en',
    // fallbackRoot: true,
    silentTranslationWarn: true, // @todo Replace with fallbackRoot: true after updating vue-i18n
    messages: {
      en
    }
  })
}

describe('ChatStartDialog.vue', () => {
  let store = null
  let snackbar = null
  let i18n = null

  beforeEach(() => {
    // mockup Store
    const mockup = mockupStore()
    store = mockup.store
    snackbar = mockup.snackbar // used as reference

    // mockup i18n
    i18n = mockupI18n()
  })

  it('renders the correct markup', () => {
    const wrapper = shallowMount(ChatStartDialog, {
      store,
      i18n,
      propsData: {
        value: true
      }
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  it('should display dialog when :value = true', () => {
    const wrapper = shallowMount(ChatStartDialog, {
      store,
      i18n,
      propsData: {
        value: true
      }
    })

    // show dialog
    expect(wrapper.vm.show).toBe(true)

    // hide dialog
    wrapper.setProps({ value: false })
    expect(wrapper.vm.show).toBe(false)
  })

  it('should show snackbar when invalid recipient address', () => {
    const wrapper = shallowMount(ChatStartDialog, {
      store,
      i18n,
      propsData: {
        value: true
      }
    })

    wrapper.setData({ recipientAddress: 'U123ABC' }) // invalid address
    wrapper.vm.startChat()

    expect(snackbar.actions.show).toHaveBeenCalled()
  })

  it('should emit `start-chat` when valid recipient address', () => {
    const wrapper = shallowMount(ChatStartDialog, {
      store,
      i18n,
      propsData: {
        value: true
      }
    })

    wrapper.setData({ recipientAddress: 'U123456' }) // valid address
    wrapper.vm.startChat()

    expect(wrapper.emitted()['start-chat']).toBeTruthy()
    expect(wrapper.emitted().input).toEqual([[ false ]]) // should close dialog after
  })

  it('should startChat() when onScanQrcode()', () => {
    const wrapper = shallowMount(ChatStartDialog, {
      store,
      i18n,
      propsData: {
        value: true
      }
    })

    // mockup startChat() method
    wrapper.setMethods({
      startChat: jest.fn()
    })

    // should call startChat()
    const recipientAddress = 'U123456'
    wrapper.vm.onScanQrcode(recipientAddress)
    expect(wrapper.vm.startChat).toHaveBeenCalled()

    // should update recipientAddress
    expect(wrapper.vm.recipientAddress).toBe(recipientAddress)
  })
})
