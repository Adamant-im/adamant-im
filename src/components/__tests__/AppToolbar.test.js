import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import Vuetify from 'vuetify'

import AppToolbar from '@/components/AppToolbar'

Vue.use(Vuetify)

describe('AppToolbar.vue', () => {
  it('renders the correct markup', () => {
    const wrapper = shallowMount(AppToolbar, {
      mocks: {
        $router: {
          back: jest.fn()
        }
      }
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  it('should call $router.back() when goBack()', () => {
    const wrapper = shallowMount(AppToolbar, {
      mocks: {
        $router: {
          back: jest.fn()
        }
      }
    })

    wrapper.vm.goBack()
    expect(wrapper.vm.$router.back).toHaveBeenCalled()
  })

  it('should render with props', () => {
    const wrapper = shallowMount(AppToolbar, {
      propsData: {
        title: 'Title',
        subtitle: 'Subtitle'
      },
      mocks: {
        $router: {
          back: jest.fn()
        }
      }
    })

    expect(wrapper.html()).toContain('<div>Title</div>')
    expect(wrapper.html()).toContain('<div class="body-1">Subtitle</div>')
  })
})
