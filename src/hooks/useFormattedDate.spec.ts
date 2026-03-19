import { beforeEach, describe, expect, it, vi } from 'vitest'
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
    const locales = ['en', 'ru', 'de', 'zh'].map((locale) => loadLocale(locale).region)

    expect(locales).toEqual(['en-US', 'ru-RU', 'de-DE', 'zh-CN'])

    for (const locale of locales) {
      expect(() => Intl.getCanonicalLocales(locale)).not.toThrow()
    }
  })
})
