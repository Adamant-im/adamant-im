import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import Vuex from 'vuex'
import Vuetify from 'vuetify'

import mockupSnackbar from './__mocks__/store/modules/snackbar'
import AppSnackbar from '@/components/AppSnackbar'

// const localVue = createLocalVue()
// bug with vuetify when using `createLocalVue`
// See: https://stackoverflow.com/questions/51990753/vue-js-vuetify-issue-running-my-first-unit-test-with-jest

Vue.use(Vuex)
Vue.use(Vuetify)

describe('AppSnackbar.vue', () => {
  let snackbar = null
  let store = null

  // mockup store module
  beforeEach(() => {
    snackbar = mockupSnackbar()

    store = new Vuex.Store({
      modules: {
        snackbar
      }
    })
  })

  it('computed properties should be equals with store state', () => {
    const wrapper = shallowMount(AppSnackbar, {
      store
    })

    expect(wrapper.vm.show).toBe(false)
    expect(wrapper.vm.message).toBe('')
    expect(wrapper.vm.timeout).toBe(1500)
    expect(wrapper.vm.color).toBe('')
  })

  it('should update computed properties when call store mutations', () => {
    const wrapper = shallowMount(AppSnackbar, {
      store
    })

    snackbar.state.show = true
    snackbar.state.message = 'Custom message'
    snackbar.state.timeout = 3000
    snackbar.state.color = '#FF0000'

    expect(wrapper.vm.show).toBe(true)
    expect(wrapper.vm.message).toBe('Custom message')
    expect(wrapper.vm.timeout).toBe(3000)
    expect(wrapper.vm.color).toBe('#FF0000')
  })

  it('should call store mutations when modify computed properties', () => {
    const wrapper = shallowMount(AppSnackbar, {
      store
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
