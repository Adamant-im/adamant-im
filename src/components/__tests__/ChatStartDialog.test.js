import { describe, it, beforeEach, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'

import mockupI18n from './__mocks__/plugins/i18n'
import mockupSnackbar from './__mocks__/store/modules/snackbar'
import ChatStartDialog from '@/components/ChatStartDialog'

/**
 * Mockup createChat.
 */
function createChat(context, { partnerId }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (partnerId === 'U123456') {
        return resolve(true)
      }
      reject(new Error('Incorrect user id'))
    }, 1000)
  })
}

/**
 * Mockup store helper.
 */
function mockupStore() {
  const state = () => ({
    address: 'U123456',
    balance: 0,
    passphrase: ''
  })
  const snackbar = mockupSnackbar()
  const chat = {
    getters: {
      isAdamantChat: () => () => false
    },
    actions: {
      createChat: createChat
    },
    namespaced: true
  }

  const partners = {
    getters: {
      displayName: () => () => 'John Doe'
    },
    namespaced: true
  }

  const store = createStore({
    state,
    modules: {
      snackbar,
      chat,
      partners
    }
  })

  return {
    store,
    snackbar,
    chat,
    partners
  }
}

describe('ChatStartDialog.vue', () => {
  let store = null
  let snackbar = null
  let chat = null
  let partners = null
  let i18n = null

  beforeEach(() => {
    // mockup Store
    const mockup = mockupStore()
    store = mockup.store
    snackbar = mockup.snackbar // used as reference
    chat = mockup.chat // used as reference
    partners = mockup.partners

    // mockup i18n
    i18n = mockupI18n()
  })

  it('renders the correct markup', () => {
    const wrapper = mount(ChatStartDialog, {
      propsData: {
        modelValue: true
      },
      global: {
        plugins: [store, i18n]
      }
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  it('should display dialog when :value = true', () => {
    const wrapper = mount(ChatStartDialog, {
      propsData: {
        modelValue: true
      },
      global: {
        stubs: {
          QrcodeRendererDialog: true
        },
        plugins: [store, i18n]
      }
    })

    expect(wrapper.vm.show).toBe(true)
  })

  it('should hide dialog when :value = false', () => {
    const wrapper = mount(ChatStartDialog, {
      shallow: true,
      propsData: {
        modelValue: false
      },
      global: {
        plugins: [store, i18n]
      }
    })

    expect(wrapper.vm.show).toBe(false)
  })

  it('should show snackbar when invalid recipient address', async () => {
    const wrapper = mount(ChatStartDialog, {
      shallow: true,
      propsData: {
        modelValue: false
      },
      global: {
        plugins: [store, i18n]
      }
    })

    wrapper.setData({ recipientAddress: 'U123ABC' }) // invalid address

    try {
      await wrapper.vm.startChat()
    } catch (err) {}

    expect(snackbar.actions.show).toHaveBeenCalled()
  })

  it('should emit `start-chat` when valid recipient address', async () => {
    const wrapper = mount(ChatStartDialog, {
      shallow: true,
      propsData: {
        modelValue: false
      },
      global: {
        plugins: [store, i18n]
      }
    })

    wrapper.setData({ recipientAddress: 'U123456' }) // valid address
    await wrapper.vm.startChat()

    expect(wrapper.emitted()['start-chat']).toBeTruthy()
    expect(wrapper.emitted()['update:modelValue']).toEqual([[false]]) // should close dialog after
  })
})
