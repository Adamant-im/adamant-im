import { vi, describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import mockupI18n from './__mocks__/plugins/i18n'
import AppNavigation from '@/components/AppNavigation'

describe('AppNavigation.vue', () => {
  it('renders the correct markup', () => {
    const wrapper = mount(AppNavigation, {
      shallow: true,
      global: {
        mocks: {
          $route: {
            path: '/home'
          },
          $router: {
            push: vi.fn()
          },
          $t: vi.fn(),
          $store: {
            getters: {}
          }
        },
        plugins: [mockupI18n()]
      }
    })

    expect(wrapper.element).toMatchSnapshot()
  })
})
