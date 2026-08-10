import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'

import { useElectronThemeSync } from './useElectronThemeSync'

const { commitMock } = vi.hoisted(() => ({
  commitMock: vi.fn()
}))

vi.mock('vuex', () => ({
  useStore: () => ({ commit: commitMock })
}))

const userAgentDescriptor = Object.getOwnPropertyDescriptor(navigator, 'userAgent')
const matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia')

const TestHost = defineComponent({
  name: 'UseElectronThemeSyncHost',
  setup() {
    useElectronThemeSync()

    return {}
  },
  template: '<div />'
})

function setUserAgent(value: string) {
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    value
  })
}

describe('useElectronThemeSync', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    commitMock.mockReset()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null

    if (userAgentDescriptor) {
      Object.defineProperty(navigator, 'userAgent', userAgentDescriptor)
    }

    if (matchMediaDescriptor) {
      Object.defineProperty(window, 'matchMedia', matchMediaDescriptor)
    } else {
      Reflect.deleteProperty(window, 'matchMedia')
    }
  })

  it('syncs Electron with the OS theme and removes its listener', () => {
    setUserAgent('Mozilla/5.0 Electron/40.0.0')

    const listeners: { change?: (event: MediaQueryListEvent) => void } = {}
    const mediaQuery = {
      matches: true,
      addEventListener: vi.fn((type: string, listener: (event: MediaQueryListEvent) => void) => {
        if (type === 'change') listeners.change = listener
      }),
      removeEventListener: vi.fn()
    }
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => mediaQuery)
    })

    wrapper = mount(TestHost)

    expect(commitMock).toHaveBeenCalledWith('options/updateOption', {
      key: 'darkTheme',
      value: true
    })

    listeners.change?.({ matches: false } as MediaQueryListEvent)
    expect(commitMock).toHaveBeenLastCalledWith('options/updateOption', {
      key: 'darkTheme',
      value: false
    })

    wrapper.unmount()
    wrapper = null

    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', listeners.change)
  })

  it('does not override the saved theme in a browser', () => {
    setUserAgent('Mozilla/5.0 Chrome/140.0.0.0')
    const matchMedia = vi.fn()
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: matchMedia
    })

    wrapper = mount(TestHost)

    expect(matchMedia).not.toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
  })
})
