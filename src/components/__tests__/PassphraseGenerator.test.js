import { vi, describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PassphraseGenerator from '@/components/PassphraseGenerator'

import mockupI18n from './__mocks__/plugins/i18n'

vi.mock('@/lib/textHelpers', () => ({
  downloadFile: () => {}
}))

vi.mock('copy-to-clipboard', () => ({
  default: vi.fn()
}))

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

  it('should emit "copy" when copyToClipboard()', () => {
    const wrapper = mount(PassphraseGenerator, {
      shallow: true,
      global: {
        stubs: {
          VTextarea: {
            template: `<textarea/>`
          }
        },
        plugins: [i18n]
      }
    })

    wrapper.vm.passphrase = 'passphrase'
    wrapper.vm.copyToClipboard()

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

  it('should generate passphrase when generatePassphrase()', () => {
    const wrapper = mount(PassphraseGenerator, {
      shallow: true,
      global: {
        plugins: [i18n]
      }
    })

    wrapper.vm.generatePassphrase()

    expect(wrapper.vm.showPassphrase).toBe(true)
    expect(wrapper.vm.passphrase.length > 0).toBe(true)
  })
})
