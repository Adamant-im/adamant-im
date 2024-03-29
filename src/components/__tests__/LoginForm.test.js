import { vi, describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import LoginForm from '@/components/LoginForm'

import mockupI18n from './__mocks__/plugins/i18n'
import loginMock from './__mocks__/login'

// Because Node.js is not supporting Promise.finally.
// In the future, polyfill can be added.
// eslint-disable-next-line
Promise.prototype.finally =
  Promise.prototype.finally ||
  {
    finally(fn) {
      const onFinally = (cb) => Promise.resolve(fn()).then(cb)
      return this.then(
        (result) => onFinally(() => result),
        (reason) =>
          onFinally(() => {
            throw reason
          })
      )
    }
  }.finally

/**
 * Mockup store helper
 */
function mockupStore() {
  const state = () => ({
    address: '',
    balance: 0,
    passphrase: ''
  })

  const getters = {
    isLogged: vi.fn()
  }

  const mutations = {
    setAddress: vi.fn(),
    setBalance: vi.fn(),
    setPassphrase: vi.fn()
  }

  const actions = {
    login: loginMock,
    logout: vi.fn()
  }

  const store = createStore({
    state,
    getters,
    mutations,
    actions
  })

  return {
    store,
    state,
    getters,
    mutations,
    actions
  }
}

describe('LoginForm.vue', () => {
  let i18n = null
  let store = null

  beforeEach(() => {
    const vuex = mockupStore()

    store = vuex.store

    i18n = mockupI18n()
  })

  it('renders the correct markup', () => {
    const wrapper = mount(LoginForm, {
      shallow: true,
      global: {
        plugins: [i18n, store]
      }
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  it('should login with passphrase', async () => {
    const wrapper = mount(LoginForm, {
      shallow: true,
      propsData: {
        modelValue: 'correct passphrase'
      },
      global: {
        plugins: [i18n, store]
      }
    })

    const promise = wrapper.vm.login()
    await expect(promise).resolves.toEqual(true)

    expect(wrapper.emitted().login).toBeTruthy()
  })

  it('should throw error when login with incorrect passphrase', async () => {
    const wrapper = mount(LoginForm, {
      shallow: true,
      global: {
        plugins: [i18n, store]
      }
    })

    wrapper.vm.passphrase = 'incorrect passphrase'

    const promise = wrapper.vm.login()

    try {
      await promise
    } catch (e) {
      expect(e.message).toEqual('Incorrect passphrase')
    }
  })

  it('should freeze form when calling freeze()', () => {
    const wrapper = mount(LoginForm, {
      shallow: true,
      global: {
        plugins: [i18n, store]
      }
    })

    // default values
    expect(wrapper.vm.disabledButton).toBe(false)
    expect(wrapper.vm.showSpinner).toBe(false)

    // freeze
    wrapper.vm.freeze()
    expect(wrapper.vm.disabledButton).toBe(true)
    expect(wrapper.vm.showSpinner).toBe(true)

    // antifreeze
    wrapper.vm.antiFreeze()
    expect(wrapper.vm.disabledButton).toBe(false)
    expect(wrapper.vm.showSpinner).toBe(false)
  })
})
