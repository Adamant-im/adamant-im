import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import Vuetify from 'vuetify'

import mockupI18n from './__mocks__/plugins/i18n'
import AppNavigation from '@/components/AppNavigation'
import Container from '@/components/Container'

jest.mock('@/store', () => {})

Vue.use(Vuex)
Vue.use(VueI18n)
Vue.use(Vuetify)
Vue.component('container', Container)

/**
 * Mockup store helper
 */
function mockupStore () {
  const actions = {
    reset: jest.fn(),
    logout: jest.fn()
  }

  const chat = {
    state: {
      numOfNewMessages: 0 // fake key for getter test
    },
    getters: {
      totalNumOfNewMessages: state => state.numOfNewMessages
    },
    namespaced: true
  }

  const options = {
    state: {
      logoutOnTabClose: false
    },
    mutations: {
      updateOption: jest.fn()
    },
    namespaced: true
  }

  const store = new Vuex.Store({
    actions,
    modules: {
      chat,
      options
    }
  })

  return {
    store,
    chat,
    options,
    actions
  }
}

describe('AppNavigation.vue', () => {
  let i18n = null
  let store = null
  let actions = null
  let chat = null
  let options = null

  beforeEach(() => {
    // mockup chat module
    const vuex = mockupStore()
    store = vuex.store
    actions = vuex.actions
    chat = vuex.chat
    options = vuex.options

    // mockup i18n
    i18n = mockupI18n()
  })

  it('renders the correct markup', () => {
    const wrapper = shallowMount(AppNavigation, {
      store,
      i18n,
      mocks: {
        $route: {
          'path': '/home'
        },
        $router: {
          push: jest.fn()
        }
      }
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  it('verify vm.data', () => {
    const wrapper = shallowMount(AppNavigation, {
      store,
      i18n,
      mocks: {
        $route: {
          'path': '/home'
        }
      }
    })
    const vm = wrapper.vm

    expect(Array.isArray(vm.pages)).toBe(true)
    expect(vm.currentPageIndex).toBe(0)
    expect(vm.showNav).toBe(true)
  })

  it('should cause mutations in store & call $router.push("/") when logout()', async () => {
    const wrapper = shallowMount(AppNavigation, {
      store,
      i18n,
      mocks: {
        $route: {
          'path': '/home'
        },
        $router: {
          push: jest.fn()
        }
      }
    })

    const promise = wrapper.vm.logout()

    await expect(promise).resolves.toEqual(undefined) // clearDb
    expect(actions.logout).toHaveBeenCalled()
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/')
  })

  it('should return indexOf current page depending on the $route.path', () => {
    const wrapper = shallowMount(AppNavigation, {
      store,
      i18n,
      mocks: {
        $route: {
          path: ''
        }
      }
    })

    wrapper.vm.$route.path = '/home'
    expect(wrapper.vm.getCurrentPageIndex()).toBe(0)

    wrapper.vm.$route.path = '/chats'
    expect(wrapper.vm.getCurrentPageIndex()).toBe(1)

    wrapper.vm.$route.path = '/options'
    expect(wrapper.vm.getCurrentPageIndex()).toBe(2)
  })

  it('should display number of new messages', () => {
    const wrapper = shallowMount(AppNavigation, {
      store,
      i18n,
      mocks: {
        $route: {
          path: ''
        }
      }
    })

    // no messages
    expect(wrapper.vm.numOfNewMessages).toBe(0)
    expect(wrapper.find('v-badge-stub > span').exists()).toBe(false) // hidden badge

    // new messages
    chat.state.numOfNewMessages = 10
    expect(wrapper.vm.numOfNewMessages).toBe(10)
    expect(wrapper.find('v-badge-stub > span').text()).toBe('10') // visible badge
  })
})
