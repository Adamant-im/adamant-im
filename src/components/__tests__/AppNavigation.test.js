import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import Vuetify from 'vuetify'

import mockupI18n from './__mocks__/plugins/i18n'
import AppNavigation from '@/components/AppNavigation'

Vue.use(Vuex)
Vue.use(VueI18n)
Vue.use(Vuetify)

// @todo Update tests after refactor store
describe('AppNavigation.vue', () => {
  let mainStoreModule = null // used as reference to check jest.fn() calls
  let store = null
  let router = null
  let i18n = null

  beforeEach(() => {
    // mockup Store
    mainStoreModule = {
      state: {
        totalNewChats: 0
      },
      mutations: {
        logout: jest.fn()
      },
      actions: {
        reset: jest.fn()
      }
    }
    store = new Vuex.Store(mainStoreModule)

    // mockup i18n
    i18n = mockupI18n
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

  it('should cause mutations in store & call $router.push("/") when logout()', () => {
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

    wrapper.vm.logout()

    expect(mainStoreModule.mutations.logout).toHaveBeenCalled()
    expect(mainStoreModule.actions.reset).toHaveBeenCalled()
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
    expect(wrapper.find('vbadge-stub > span').exists()).toBe(false) // hidden badge

    // new messages
    mainStoreModule.state.totalNewChats = 10
    expect(wrapper.find('vbadge-stub > span').text()).toBe('10') // visible badge
  })
})
