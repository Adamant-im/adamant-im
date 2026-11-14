import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { useModalsStore } from '@/stores/modals'

vi.mock('@/components/modals/registry', () => ({
  modalRegistry: {
    FakeDialog: defineComponent({
      props: { modelValue: Boolean, partnerId: String },
      emits: ['close', 'dismiss', 'update:modelValue'],
      setup(props, { emit }) {
        return () =>
          h('div', { class: 'fake-dialog' }, [
            h('button', { class: 'ok', onClick: () => emit('close', props.partnerId) }),
            h('button', { class: 'cancel', onClick: () => emit('update:modelValue', false) })
          ])
      }
    })
  }
}))

import ModalsHost from '@/components/modals/ModalsHost.vue'

describe('ModalsHost.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders an opened modal and resolves with its result', async () => {
    const store = useModalsStore()
    const wrapper = mount(ModalsHost)
    const promise = store.open<string>({ component: 'FakeDialog', props: { partnerId: 'U1' } })
    await wrapper.vm.$nextTick()

    await wrapper.find('.ok').trigger('click')

    await expect(promise).resolves.toBe('U1')
    expect(store.stack[0].isOpen).toBe(false)
  })

  it('dismisses the modal when the dialog asks to hide', async () => {
    const store = useModalsStore()
    const wrapper = mount(ModalsHost)
    const promise = store.open({ component: 'FakeDialog' })
    await wrapper.vm.$nextTick()

    await wrapper.find('.cancel').trigger('click')

    await expect(promise).resolves.toBeUndefined()
  })
})
