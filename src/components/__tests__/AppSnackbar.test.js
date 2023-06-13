import { describe, it, expect, beforeEach } from 'vitest'
import { SNACKBAR_TIMEOUT } from '@/store/modules/snackbar/constants'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'

import mockupSnackbar from './__mocks__/store/modules/snackbar'
import AppSnackbar from '@/components/AppSnackbar'

describe('AppSnackbar.vue', () => {
  let snackbar = null
  let store = null

  // mockup store module
  beforeEach(() => {
    snackbar = mockupSnackbar()

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
        plugins: [store]
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
        plugins: [store]
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
})
