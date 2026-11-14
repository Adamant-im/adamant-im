import { describe, expect, it, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore, type Store } from 'vuex'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import mockupI18n from './__mocks__/plugins/i18n'
import BuildInfo from '@/components/BuildInfo.vue'
import BuildInfoDialog from '@/components/BuildInfoDialog.vue'

if (typeof window !== 'undefined' && !window.visualViewport) {
  window.visualViewport = {
    width: 1024,
    height: 768,
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    scale: 1,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  } as unknown as VisualViewport
}

if (typeof global !== 'undefined' && !global.ResizeObserver) {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

const vuetify = createVuetify({
  components,
  directives
})

interface MockStoreState {
  options: {
    devModeEnabled: boolean
  }
}

function mockupStore(options?: { isLogged?: boolean }): Store<MockStoreState> {
  return createStore<MockStoreState>({
    getters: {
      isLogged: () => options?.isLogged ?? false
    },
    modules: {
      options: {
        namespaced: true,
        state: () => ({
          devModeEnabled: false
        }),
        mutations: {
          updateOption(state: any, { key, value }: { key: string; value: any }) {
            if (key in state) {
              state[key] = value
            }
          }
        }
      },
      snackbar: {
        namespaced: true,
        actions: {
          show: vi.fn() as any
        }
      }
    }
  })
}

describe('BuildInfo.vue', () => {
  it('renders master build compact form', () => {
    const store = mockupStore()
    const i18n = mockupI18n()

    const wrapper = mount(BuildInfo, {
      props: {
        buildInfo: {
          version: '4.8.1',
          branch: 'master',
          commit: '60e87c6',
          prNumber: null,
          author: 'bludnic',
          buildDate: '2025-02-25 13:44',
          isTestnet: false
        }
      },
      global: {
        plugins: [store, i18n, vuetify]
      }
    })

    const lines = wrapper.findAll('.build-info__line').map((el) => el.text())
    expect(lines[0]).toBe('v4.8.1')
    expect(lines.length).toBe(1)
    expect(wrapper.find('.build-info__testnet-badge').exists()).toBe(false)
  })

  it('renders dev build compact form in two lines', () => {
    const store = mockupStore()
    const i18n = mockupI18n()

    const wrapper = mount(BuildInfo, {
      props: {
        buildInfo: {
          version: '4.8.1',
          branch: 'dev',
          commit: '60e87c6',
          prNumber: null,
          author: 'bludnic',
          buildDate: '2025-02-25 13:44',
          isTestnet: false
        }
      },
      global: {
        plugins: [store, i18n, vuetify]
      }
    })

    const lines = wrapper.findAll('.build-info__line').map((el) => el.text())
    expect(lines[0]).toBe('v4.8.1')
    expect(lines[1]).toBe('dev 60e87c6')
  })

  it('renders PR preview build compact form in two lines', () => {
    const store = mockupStore()
    const i18n = mockupI18n()

    const wrapper = mount(BuildInfo, {
      props: {
        buildInfo: {
          version: '4.8.1',
          branch: 'feature/pr-preview',
          commit: '60e87c6',
          prNumber: '712',
          author: 'bludnic',
          buildDate: '2025-02-25 13:44',
          isTestnet: false
        }
      },
      global: {
        plugins: [store, i18n, vuetify]
      }
    })

    const lines = wrapper.findAll('.build-info__line').map((el) => el.text())
    expect(lines[0]).toBe('v4.8.1')
    expect(lines[1]).toBe('712 60e87c6')
  })

  it('renders plain branch build compact form in two lines', () => {
    const store = mockupStore()
    const i18n = mockupI18n()

    const wrapper = mount(BuildInfo, {
      props: {
        version: '4.8.1',
        buildInfo: {
          version: '4.8.1',
          branch: 'feature/some-work',
          commit: '60e87c6',
          prNumber: null,
          author: 'bludnic',
          buildDate: '2025-02-25 13:44',
          isTestnet: false
        }
      },
      global: {
        plugins: [store, i18n, vuetify]
      }
    })

    const lines = wrapper.findAll('.build-info__line').map((el) => el.text())
    expect(lines[0]).toBe('v4.8.1')
    expect(lines[1]).toBe('60e87c6')
  })

  it('marks testnet builds unmistakably', () => {
    const store = mockupStore()
    const i18n = mockupI18n()

    const wrapper = mount(BuildInfo, {
      props: {
        buildInfo: {
          version: '4.8.1',
          branch: 'dev',
          commit: '60e87c6',
          prNumber: null,
          author: 'bludnic',
          buildDate: '2025-02-25 13:44',
          isTestnet: true
        }
      },
      global: {
        plugins: [store, i18n, vuetify]
      }
    })

    expect(wrapper.classes()).toContain('build-info--testnet')
    const badge = wrapper.find('.build-info__testnet-badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('Testnet')
  })

  it('opens BuildInfoDialog when trigger button is clicked', async () => {
    const store = mockupStore()
    const i18n = mockupI18n()

    const wrapper = mount(BuildInfo, {
      props: {
        buildInfo: {
          version: '4.8.1',
          branch: 'master',
          commit: '60e87c6',
          prNumber: null,
          author: 'bludnic',
          buildDate: '2025-02-25 13:44',
          isTestnet: false
        }
      },
      global: {
        plugins: [store, i18n, vuetify]
      }
    })

    const button = wrapper.find('button[data-test-id="version-info"]')
    expect(wrapper.findComponent(BuildInfoDialog).props('modelValue')).toBe(false)

    await button.trigger('click')

    expect(wrapper.findComponent(BuildInfoDialog).props('modelValue')).toBe(true)
  })
})

describe('BuildInfoDialog.vue', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders all build information correctly and localizes', () => {
    const store = mockupStore()
    const i18n = mockupI18n()

    const wrapper = mount(BuildInfoDialog, {
      props: {
        modelValue: true,
        buildInfo: {
          version: '4.8.1',
          branch: 'dev',
          commit: '60e87c6',
          prNumber: '712',
          author: 'bludnic',
          buildDate: '2025-02-25 13:44',
          isTestnet: true
        }
      },
      global: {
        plugins: [store, i18n, vuetify]
      }
    })

    const text = document.body.textContent || wrapper.text()
    expect(text).toContain('ADAMANT Messenger')
    expect(text).toContain('v4.8.1')
    expect(text).toContain('dev')
    expect(text).toContain('#712')
    expect(text).toContain('60e87c6')
    expect(text).toContain('bludnic')
    expect(text).toContain('2025-02-25 13:44')
    expect(text).toContain('Testnet')
    expect(text).toContain('Close')
    expect(text).toContain('Force refresh')
  })

  it('triggers dev mode after 10 taps on Version row when allowDevModeUnlock is true', async () => {
    const store = mockupStore()
    const i18n = mockupI18n()
    const commitSpy = vi.spyOn(store, 'commit')

    mount(BuildInfoDialog, {
      attachTo: document.body,
      props: {
        modelValue: true,
        allowDevModeUnlock: true,
        buildInfo: {
          version: '4.8.1',
          branch: 'dev',
          commit: '60e87c6',
          prNumber: null,
          author: 'bludnic',
          buildDate: '2025-02-25 13:44',
          isTestnet: false
        }
      },
      global: {
        plugins: [store, i18n, vuetify]
      }
    })

    const versionRow = document.querySelector('[data-test-id="dialog-version-row"]') as HTMLElement
    expect(versionRow).not.toBeNull()
    expect(versionRow.classList.contains('build-info-dialog__meta-row--clickable')).toBe(true)

    for (let i = 0; i < 9; i++) {
      versionRow.click()
    }
    expect(store.state.options.devModeEnabled).toBe(false)

    versionRow.click() // 10th tap
    expect(commitSpy).toHaveBeenCalledWith('options/updateOption', {
      key: 'devModeEnabled',
      value: true
    })
    expect(store.state.options.devModeEnabled).toBe(true)
  })

  it('does not trigger dev mode in dialog when allowDevModeUnlock is false', async () => {
    const store = mockupStore()
    const i18n = mockupI18n()
    const commitSpy = vi.spyOn(store, 'commit')

    mount(BuildInfoDialog, {
      attachTo: document.body,
      props: {
        modelValue: true,
        allowDevModeUnlock: false,
        buildInfo: {
          version: '4.8.1',
          branch: 'dev',
          commit: '60e87c6',
          prNumber: null,
          author: 'bludnic',
          buildDate: '2025-02-25 13:44',
          isTestnet: false
        }
      },
      global: {
        plugins: [store, i18n, vuetify]
      }
    })

    const versionRow = document.querySelector('[data-test-id="dialog-version-row"]') as HTMLElement
    expect(versionRow).not.toBeNull()
    expect(versionRow.classList.contains('build-info-dialog__meta-row--clickable')).toBe(false)

    for (let i = 0; i < 12; i++) {
      versionRow.click()
    }
    expect(commitSpy).not.toHaveBeenCalledWith('options/updateOption', {
      key: 'devModeEnabled',
      value: true
    })
    expect(store.state.options.devModeEnabled).toBe(false)
  })

  it('requires in-dialog confirmation before reload when user is logged in', async () => {
    const store = mockupStore({ isLogged: true })
    const i18n = mockupI18n()

    const wrapper = mount(BuildInfoDialog, {
      attachTo: document.body,
      props: {
        modelValue: true,
        buildInfo: {
          version: '4.8.1',
          branch: 'dev',
          commit: '60e87c6',
          prNumber: null,
          author: 'bludnic',
          buildDate: '2025-02-25 13:44',
          isTestnet: false
        }
      },
      global: {
        plugins: [store, i18n, vuetify]
      }
    })

    const buttons = Array.from(document.querySelectorAll('button'))
    const refreshBtn = buttons.find((btn) => btn.textContent?.includes('Force refresh'))
    expect(refreshBtn).toBeDefined()
    refreshBtn!.click()
    await wrapper.vm.$nextTick()

    expect(document.querySelector('.build-info-dialog__confirm-warning')).not.toBeNull()
    expect(document.body.textContent).toContain('Cancel')

    const cancelBtn = Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Cancel')
    )
    expect(cancelBtn).toBeDefined()
    cancelBtn!.click()
    await wrapper.vm.$nextTick()

    expect(document.querySelector('.build-info-dialog__confirm-warning')).toBeNull()
  })

  it('shows offline snackbar feedback when user triggers refresh offline', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      writable: true,
      value: false
    })

    const store = mockupStore({ isLogged: false })
    const dispatchSpy = vi.spyOn(store, 'dispatch')
    const i18n = mockupI18n()

    const wrapper = mount(BuildInfoDialog, {
      attachTo: document.body,
      props: {
        modelValue: true,
        buildInfo: {
          version: '4.8.1',
          branch: 'dev',
          commit: '60e87c6',
          prNumber: null,
          author: 'bludnic',
          buildDate: '2025-02-25 13:44',
          isTestnet: false
        }
      },
      global: {
        plugins: [store, i18n, vuetify]
      }
    })

    const buttons = Array.from(document.querySelectorAll('button'))
    const refreshBtn = buttons.find((btn) => btn.textContent?.includes('Force refresh'))
    expect(refreshBtn).toBeDefined()
    refreshBtn!.click()
    await wrapper.vm.$nextTick()

    expect(dispatchSpy).toHaveBeenCalledWith('snackbar/show', {
      message: 'You are offline. Try again when connected',
      timeout: 3000
    })

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      writable: true,
      value: true
    })
  })
})
