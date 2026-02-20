import { vi, describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import mockupI18n from './__mocks__/plugins/i18n'
import AppNavigation from '@/components/AppNavigation'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    path: '/home'
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}))

describe('AppNavigation.vue', () => {
  it('renders the correct markup', () => {
    const store = createStore({
      getters: {
        'chat/totalNumOfNewMessages': () => 5,
        'wallets/getVisibleSymbolsCount': () => 1
      }
    })

    const wrapper = mount(AppNavigation, {
      shallow: true,
      global: {
        plugins: [mockupI18n(), store]
      }
    })

    expect(wrapper.element).toMatchSnapshot()
  })
})
