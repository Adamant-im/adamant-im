import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
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

function mockupStore() {
  return createStore({
    modules: {
      options: {
        namespaced: true,
        state: () => ({
          devMode: false
        }),
        mutations: {
          updateOption: vi.fn()
        }
      },
      snackbar: {
        namespaced: true,
        actions: {
          show: vi.fn()
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
    expect(lines[1]).toBe('60e87c6')
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
    expect(badge.text()).toBe('TESTNET')
  })

  it('triggers dev mode after 10 taps', async () => {
    const store = mockupStore()
    const i18n = mockupI18n()
    const commitSpy = vi.spyOn(store, 'commit')
    const dispatchSpy = vi.spyOn(store, 'dispatch')

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
    for (let i = 0; i < 9; i++) {
      await button.trigger('click')
    }

    expect(commitSpy).not.toHaveBeenCalledWith('options/updateOption', {
      key: 'devMode',
      value: true
    })

    await button.trigger('click') // 10th tap

    expect(commitSpy).toHaveBeenCalledWith('options/updateOption', {
      key: 'devMode',
      value: true
    })
    expect(dispatchSpy).toHaveBeenCalledWith('snackbar/show', {
      message: 'Dev screens enabled',
      timeout: 3000
    })
  })
})

describe('BuildInfoDialog.vue', () => {
  it('renders all build information correctly and localizes', () => {
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
        plugins: [i18n, vuetify]
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
    expect(text).toContain('Update app')
  })
})
