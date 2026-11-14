import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_LOCALE } from '@/i18n'
import language from '@/store/modules/language'

const mockBrowserLanguages = (languages) =>
  vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(languages)

describe('language store module', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with the first supported browser language', () => {
    mockBrowserLanguages(['uk-UA', 'ja-JP', 'en-US'])

    expect(language.state().currentLocale).toBe('ja')
  })

  it('starts with the default locale when no browser language is supported', () => {
    mockBrowserLanguages(['pt-BR', 'it-IT'])

    expect(language.state().currentLocale).toBe(DEFAULT_LOCALE)
  })

  it('accepts only supported locale codes', () => {
    const state = { currentLocale: 'en' }

    language.mutations.changeLocale(state, 'ar')
    expect(state.currentLocale).toBe('ar')

    language.mutations.changeLocale(state, 'zh-CN')
    language.mutations.changeLocale(state, 'xx')
    language.mutations.changeLocale(state, undefined)
    expect(state.currentLocale).toBe('ar')
  })
})
