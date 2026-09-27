import { describe, expect, it } from 'vitest'

import { SUPPORTED_LOCALES } from '@/i18n'
import { getEmojiPickerLocale } from '@/lib/emojiPickerLocale'

describe('getEmojiPickerLocale', () => {
  it.each(SUPPORTED_LOCALES)(
    'never leaves emoji-mart to download %s translations from a CDN',
    async (locale) => {
      const options = await getEmojiPickerLocale(locale)

      // emoji-mart fetches a translation from a public CDN when a non-English locale comes
      // without an `i18n` object
      if (options.locale !== 'en') {
        expect(options.i18n).toEqual(expect.objectContaining({ search: expect.any(String) }))
      }
      expect(options.locale).toBe(locale)
    }
  )

  it('lays the Arabic picker out right to left', async () => {
    const options = await getEmojiPickerLocale('ar')

    expect(options.i18n).toEqual(expect.objectContaining({ rtl: true }))
  })

  it('falls back to the bundled English strings for other locales', async () => {
    expect(await getEmojiPickerLocale('pt')).toEqual({ locale: 'en' })
  })
})
