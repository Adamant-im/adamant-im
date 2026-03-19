import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'

const mocks = vi.hoisted(() => {
  let visibilityHandler: ((event: unknown, state: string) => void) | undefined

  return {
    now: { value: new Date('2026-01-01T00:00:00.000Z') },
    pause: vi.fn(),
    resume: vi.fn(),
    change: vi.fn((handler: (event: unknown, state: string) => void) => {
      visibilityHandler = handler
      return 77
    }),
    unbind: vi.fn(),
    emitVisibility: (state: string) => {
      visibilityHandler?.({}, state)
    }
  }
})

vi.mock('@vueuse/core', () => ({
  useNow: vi.fn(() => ({
    now: mocks.now,
    pause: mocks.pause,
    resume: mocks.resume
  }))
}))

vi.mock('visibilityjs', () => ({
  default: {
    change: mocks.change,
    unbind: mocks.unbind
  }
}))

import { useChatsSpinner } from './useChatsSpinner'

const createTestStore = () =>
  createStore({
    state: {
      chat: {
        chatsActualUntil: Date.parse('2026-01-01T00:00:10.000Z')
      }
    },
    getters: {
      'nodes/adm': () => [{ status: 'online' }]
    }
  })

const TestComponent = defineComponent({
  setup() {
    const showSpinner = useChatsSpinner()
    return { showSpinner }
  },
  template: '<div>{{ showSpinner }}</div>'
})

describe('useChatsSpinner lifecycle', () => {
  beforeEach(() => {
    mocks.pause.mockClear()
    mocks.resume.mockClear()
    mocks.change.mockClear()
    mocks.unbind.mockClear()
    mocks.now.value = new Date('2026-01-01T00:00:00.000Z')
  })

  it('wires visibility listener and controls useNow pause/resume', () => {
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [createTestStore()]
      }
    })

    expect(mocks.change).toHaveBeenCalledTimes(1)

    mocks.emitVisibility('hidden')
    expect(mocks.pause).toHaveBeenCalledTimes(1)

    mocks.emitVisibility('visible')
    expect(mocks.resume).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    expect(mocks.unbind).toHaveBeenCalledWith(77)
  })
})
