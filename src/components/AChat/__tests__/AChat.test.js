import { mount, shallowMount, createLocalVue } from '@vue/test-utils'
import Vuetify from 'vuetify'

import AChat from '../AChat.vue'

const localVue = createLocalVue()
localVue.use(Vuetify)

describe('AChat.vue', () => {
  it('renders the correct markup', () => {
    const wrapper = shallowMount(AChat, {
      localVue
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  it('should set ref to `messages`', () => {
    const wrapper = mount(AChat, {
      localVue
    })

    expect(wrapper.vm.$refs.messages).toBeTruthy()
  })

  // @todo More tests
  // @todo fix error `[Vuetify] Multiple instances of Vue detected`
})
