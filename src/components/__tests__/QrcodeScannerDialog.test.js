import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import Vuetify from 'vuetify'

import mockupI18n from './__mocks__/plugins/i18n'
import mockupSnackbar from './__mocks__/store/modules/snackbar'
import QrcodeScannerDialog from '@/components/QrcodeScannerDialog'

Vue.use(Vuex)
Vue.use(VueI18n)
Vue.use(Vuetify)

/** Mock Instascan **/
jest.mock('instascan', () => {})

/**
 * Mockup store helper.
 */
function mockupStore () {
  const snackbar = mockupSnackbar()

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
    const wrapper = shallowMount(QrcodeScannerDialog, {
      store,
      i18n,
      propsData: {
        value: true
      }
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  it('should display dialog when :value = true', () => {
    const wrapper = shallowMount(QrcodeScannerDialog, {
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

  // @todo mockup Instascan
})
