import { shallowMount, mount } from '@vue/test-utils'
import Vue from 'vue'
import Vuetify from 'vuetify'

import ChatPreview from '@/components/ChatPreview'

Vue.use(Vuetify)

describe('ChatPreview.vue', () => {
  it('renders the correct markup', () => {
    const wrapper = shallowMount(ChatPreview)

    expect(wrapper.element).toMatchSnapshot()
  })

  it('item click should emit `click`', () => {
    const wrapper = mount(ChatPreview)

    const el = wrapper.find('.chat-preview')
    el.trigger('click')

    expect(wrapper.emitted().click).toBeTruthy()
  })
})
