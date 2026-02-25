import { vi, describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
vi.mock('@/lib/nodes/adm', () => ({
  adm: {}
}))
import AChat from '../AChat.vue'

global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

describe('AChat.vue', () => {
  it('renders the correct markup', () => {
    const wrapper = mount(AChat, {
      shallow: true
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  it('should set ref to `messages`', () => {
    const wrapper = mount(AChat)

    expect(wrapper.vm.messagesRef).toBeTruthy()
  })
})
