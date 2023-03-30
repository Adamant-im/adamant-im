import { vi, describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'

import mockupI18n from './__mocks__/plugins/i18n'
import mockupSnackbar from './__mocks__/store/modules/snackbar'
import QrcodeScannerDialog from '@/components/QrcodeScannerDialog'

vi.mock('@zxing/library', () => ({
  BrowserQRCodeReader: class BrowserQRCodeReader {
    constructor() {}

    getVideoInputDevices() {
      return Promise.resolve([
        {
          deviceId: 1
        }
      ])
    }

    decodeFromInputVideoDevice() {
      return Promise.resolve({
        text: 'decoded text'
      })
    }

    reset() {
      return Promise.resolve()
    }
  }
}))

/**
 * Mockup store helper.
 */
function mockupStore() {
  const snackbar = mockupSnackbar()

  const store = createStore({
    modules: {
      snackbar
    }
  })

  return {
    store,
    snackbar
  }
}

describe('QrcodeScannerDialog.vue', () => {
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
    const wrapper = mount(QrcodeScannerDialog, {
      shallow: true,
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
    const wrapper = mount(QrcodeScannerDialog, {
      shallow: true,
      propsData: {
        modelValue: true
      },
      global: {
        plugins: [store, i18n]
      }
    })

    expect(wrapper.vm.show).toBe(true)
  })

  it('should hide dialog when :value = false', () => {
    const wrapper = mount(QrcodeScannerDialog, {
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
})
