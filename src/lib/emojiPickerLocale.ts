/**
 * emoji-mart downloads translations it does not have from a public CDN. The app ships them
 * instead, so opening the emoji picker never contacts a third party.
 */
const translations: Record<string, () => Promise<{ default: object }>> = {
  ar: () => import('@emoji-mart/data/i18n/ar.json'),
  de: () => import('@emoji-mart/data/i18n/de.json'),
  es: () => import('@emoji-mart/data/i18n/es.json'),
  fr: () => import('@emoji-mart/data/i18n/fr.json'),
  ja: () => import('@emoji-mart/data/i18n/ja.json'),
  ru: () => import('@emoji-mart/data/i18n/ru.json'),
  zh: () => import('@emoji-mart/data/i18n/zh.json')
}

export type EmojiPickerLocale = { locale: string; i18n?: object }

/**
 * @param appLocale The current app locale
 * @returns Picker options: English is bundled with emoji-mart, every other locale comes with
 *   its translation object
 */
export async function getEmojiPickerLocale(appLocale: string): Promise<EmojiPickerLocale> {
  const load = translations[appLocale]

  if (!load) return { locale: 'en' }

  return { locale: appLocale, i18n: (await load()).default }
}
