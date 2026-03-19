import { describe, it, expect, beforeEach } from 'vitest'
import { SNACKBAR_TIMEOUT } from '@/store/modules/snackbar/constants'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import mockupI18n from './__mocks__/plugins/i18n'

import mockupSnackbar from './__mocks__/store/modules/snackbar'
import AppSnackbar from '@/components/AppSnackbar'

describe('AppSnackbar.vue', () => {
  let snackbar = null
  let store = null
  let i18n = null

  // mockup store module
  beforeEach(() => {
    snackbar = mockupSnackbar()
    i18n = mockupI18n()

    store = createStore({
      modules: {
        snackbar
      }
    })
  })

  it('computed properties should be equals with store state', () => {
    const wrapper = mount(AppSnackbar, {
      shallow: true,
      global: {
        plugins: [store, i18n]
      }
    })

    expect(wrapper.vm.show).toBe(false)
    expect(wrapper.vm.message).toBe('')
    expect(wrapper.vm.timeout).toBe(SNACKBAR_TIMEOUT)
    expect(wrapper.vm.color).toBe('')
  })

  it('should call store mutations when modify computed properties', () => {
    const wrapper = mount(AppSnackbar, {
      shallow: true,
      global: {
        plugins: [store, i18n]
      }
    })

    // open snackbar
    wrapper.vm.show = true
    expect(snackbar.mutations.changeState).toHaveBeenCalled()
    expect(snackbar.mutations.resetOptions).not.toHaveBeenCalled()

    // close snackbar (should reset options)
    wrapper.vm.show = false
    expect(snackbar.mutations.changeState).toHaveBeenCalled()
    expect(snackbar.mutations.resetOptions).toHaveBeenCalled()
  })

  it('uses persistent timeout for the offline snackbar message', () => {
    snackbar.state.message = i18n.global.t('connection.offline')
    snackbar.state.timeout = SNACKBAR_TIMEOUT

    const wrapper = mount(AppSnackbar, {
      shallow: true,
      global: {
        plugins: [store, i18n]
      }
    })

    expect(wrapper.vm.timeout).toBe(-1)
  })

  it('renders multiline messages with the semantic message and close button classes', () => {
    snackbar.state.show = true
    snackbar.state.message = 'x'.repeat(60)
    snackbar.state.timeout = 0

    const wrapper = mount(AppSnackbar, {
      shallow: true,
      global: {
        plugins: [store, i18n]
      }
    })

    expect(wrapper.classes()).toContain('multiline')
    expect(wrapper.find('.app-snackbar__message').exists()).toBe(true)
    expect(wrapper.find('.app-snackbar__close-button').exists()).toBe(true)
  })
})
