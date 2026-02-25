import { vi, describe, expect, it, beforeEach, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import PassphraseGenerator from '@/components/PassphraseGenerator'

import mockupI18n from './__mocks__/plugins/i18n'

// mocks
vi.mock('@/lib/textHelpers', () => ({
  downloadFile: () => {}
}))

vi.mock('copy-to-clipboard', () => ({
  default: vi.fn()
}))

// Prevent jsdom errors for element.scrollIntoView
beforeAll(() => {
  if (!HTMLElement.prototype.scrollIntoView) {
    // use vitest spy so we can inspect calls if needed
    HTMLElement.prototype.scrollIntoView = vi.fn()
  }
})

describe('PassphraseGenerator.vue', () => {
  let i18n = null

  beforeEach(() => {
    i18n = mockupI18n()
  })

  it('renders the correct markup', () => {
    const wrapper = mount(PassphraseGenerator, {
      shallow: true,
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.element).toMatchSnapshot()
  })

  it('check default data', () => {
    const wrapper = mount(PassphraseGenerator, {
      shallow: true,
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.vm.passphrase).toBe('')
    expect(wrapper.vm.showPassphrase).toBe(false)
  })

  it('should emit "copy" when copyToClipboardHandler()', () => {
    const wrapper = mount(PassphraseGenerator, {
      shallow: true,
      global: {
        stubs: {
          // ensure there is a textarea element for selectText()
          VTextarea: {
            template: `<div><textarea /></div>`
          }
        },
        plugins: [i18n]
      }
    })

    wrapper.vm.passphrase = 'passphrase'
    // call the actual handler defined in the component
    wrapper.vm.copyToClipboardHandler()

    expect(wrapper.emitted().copy).toBeTruthy()
  })

  it('should emit "save" when saveFile()', () => {
    // Mockup window.URL
    Object.defineProperty(window, 'URL', {
      value: {
        createObjectURL: vi.fn()
      }
    })

    const wrapper = mount(PassphraseGenerator, {
      shallow: true,
      global: {
        plugins: [i18n]
      }
    })

    wrapper.vm.passphrase = 'passphrase'
    wrapper.vm.saveFile()

    expect(wrapper.emitted().save).toBeTruthy()
  })

  it('should generate passphrase when generatePassphrase()', async () => {
    const wrapper = mount(PassphraseGenerator, {
      shallow: true,
      global: {
        plugins: [i18n]
      }
    })

    // call, wait a tick so setTimeout runs (generatePassphrase uses setTimeout)
    wrapper.vm.generatePassphrase()
    await new Promise((r) => setTimeout(r, 0))

    expect(wrapper.vm.showPassphrase).toBe(true)
    expect(wrapper.vm.passphrase.length > 0).toBe(true)
  })
})
