import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const translations: Record<string, string> = {
  region: 'en-US',
  'chats.date_today': 'Today',
  'chats.date_yesterday': 'Yesterday'
}

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => translations[key] ?? key
  })
}))

import { useFormattedDate } from '@/hooks/useFormattedDate'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const loadLocale = (locale: string) =>
  JSON.parse(readFileSync(path.resolve(currentDir, `../locales/${locale}.json`), 'utf8')) as {
    region: string
  }

describe('useFormattedDate', () => {
  beforeEach(() => {
    translations.region = 'en-US'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back to a safe locale when translations contain an invalid region tag', () => {
    translations.region = 'de-GER'

    const { formatDate } = useFormattedDate()
    const timestamp = new Date(2024, 0, 1, 12, 34, 0).getTime()
    const toLocaleDateString = vi
      .spyOn(Date.prototype, 'toLocaleDateString')
      .mockReturnValue('Jan 1')

    vi.spyOn(Date, 'now').mockReturnValue(new Date(2024, 0, 10, 12, 0, 0).getTime())

    expect(formatDate(timestamp)).toBe('Jan 1, 12:34')
    expect(toLocaleDateString).toHaveBeenCalledWith('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  })

  it('keeps locale region tags valid for date formatting', () => {
    const locales = ['ar', 'de', 'en', 'es', 'fr', 'ja', 'ru', 'zh'].map(
      (locale) => loadLocale(locale).region
    )

    expect(locales).toEqual([
      'ar-u-nu-latn',
      'de-DE',
      'en-US',
      'es-ES',
      'fr-FR',
      'ja-JP',
      'ru-RU',
      'zh-CN'
    ])

    for (const locale of locales) {
      expect(() => Intl.getCanonicalLocales(locale)).not.toThrow()
    }
  })

  it('formats Arabic dates in the Gregorian calendar with the digits used for times and amounts', () => {
    translations.region = loadLocale('ar').region

    const { formatDate } = useFormattedDate()
    vi.spyOn(Date, 'now').mockReturnValue(new Date(2024, 0, 10, 12, 0, 0).getTime())

    const formatted = formatDate(new Date(2024, 0, 1, 12, 34, 0).getTime())

    // Arabic-Indic digits would mix with the Latin `HH:mm` time and the amounts next to it
    expect(formatted).not.toMatch(/[\u0660-\u0669\u06F0-\u06F9]/)
    expect(formatted).toMatch(/^1 /)
    expect(formatted).toMatch(/12:34$/)
  })
})
