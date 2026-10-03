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
      global: {
        plugins: [store, i18n]
      }
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  it('should prefill the recipient address from the partnerId prop', async () => {
    const wrapper = mount(ChatStartDialog, {
      props: {
        partnerId: 'U123456'
      },
      global: {
        stubs: {
          QrcodeRendererDialog: true
        },
        plugins: [store, i18n]
      }
    })

    expect(wrapper.vm.recipientAddress).toBe('U123456')
  })

  it('should show snackbar when invalid recipient address', async () => {
    const wrapper = mount(ChatStartDialog, {
      shallow: true,
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

  it('should emit `close` with the chat to open when valid recipient address', async () => {
    const wrapper = mount(ChatStartDialog, {
      shallow: true,
      global: {
        plugins: [store, i18n]
      }
    })

    wrapper.setData({ recipientAddress: 'U123456' }) // valid address
    await wrapper.vm.startChat()

    expect(wrapper.emitted()['close']).toBeTruthy()
    expect(wrapper.emitted()['close']).toEqual([
      [{ partnerId: 'U123456', messageText: '', partnerName: '', retrieveKey: true }]
    ])
  })
})
