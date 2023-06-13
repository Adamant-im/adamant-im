import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import AChat from '../AChat.vue'

describe('AChat.vue', () => {
  it('renders the correct markup', () => {
    const wrapper = mount(AChat, {
      shallow: true
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  it('should set ref to `messages`', () => {
    const wrapper = mount(AChat)

    expect(wrapper.vm.$refs.messages).toBeTruthy()
  })
})
