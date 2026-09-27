import dayjs from 'dayjs'
import 'dayjs/locale/ar'
import 'dayjs/locale/de'
import 'dayjs/locale/en'
import 'dayjs/locale/es'
import 'dayjs/locale/fr'
import 'dayjs/locale/ja'
import 'dayjs/locale/ru'
import 'dayjs/locale/zh-cn'
import { createI18n } from 'vue-i18n'

import ar from './locales/ar.json'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import ja from './locales/ja.json'
import ru from './locales/ru.json'
import zh from './locales/zh.json'

export const DEFAULT_LOCALE = import.meta.env.VITE_I18N_LOCALE || 'en'
export const FALLBACK_LOCALE = import.meta.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en'

export const SUPPORTED_LOCALES = ['ar', 'de', 'en', 'es', 'fr', 'ja', 'ru', 'zh']
export const RTL_LOCALES = ['ar']

/**
 * dayjs names Simplified Chinese `zh-cn`. The app keeps `zh` as its locale code so that
 * language preferences saved by earlier versions keep working.
 */
const DAYJS_LOCALES = {
  ar: 'ar',
  de: 'de',
  en: 'en',
  es: 'es',
  fr: 'fr',
  ja: 'ja',
  ru: 'ru',
  zh: 'zh-cn'
}

export function isRtlLocale(locale) {
  return RTL_LOCALES.includes(locale)
}

/**
 * Maps a BCP 47 tag such as `zh-CN`, `pt_BR` or `ar-EG` to a supported app locale.
 * Every Chinese tag maps to `zh`, which is Simplified Chinese.
 * @param {unknown} tag
 * @returns {string | null} The supported locale, or `null` when there is none
 */
export function matchSupportedLocale(tag) {
  if (typeof tag !== 'string') return null

  const primary = tag.toLowerCase().split(/[-_]/)[0]

  return SUPPORTED_LOCALES.includes(primary) ? primary : null
}

/**
 * @param {unknown} tag
 * @returns {string} The supported locale for `tag`, or the default locale
 */
export function normalizeLocale(tag) {
  return matchSupportedLocale(tag) ?? DEFAULT_LOCALE
}

/**
 * Picks the first supported language from the browser preferences.
 * Only the local `navigator` is read; nothing leaves the device.
 * @param {readonly string[]} [languages]
 * @returns {string}
 */
export function detectLocale(languages = getBrowserLanguages()) {
  for (const tag of languages) {
    const locale = matchSupportedLocale(tag)

    if (locale) return locale
  }

  return DEFAULT_LOCALE
}

function getBrowserLanguages() {
  if (typeof window === 'undefined' || !window.navigator) return []

  const { languages, language } = window.navigator

  return languages?.length ? languages : [language]
}

export const pluralRules = {
  /**
   * Russian pluralization rule
   * @param choice {number} a choice index given by the input to $tc
   * @param choicesLength {number} an overall amount of available choices
   * @returns a final choice index to select plural word by
   */
  ru: function (choice, choicesLength) {
    if (choice === 0) {
      return 0
    }
    const teen = choice % 100 >= 11 && choice % 100 <= 19
    const endsWithOne = choice % 10 === 1
    if (choicesLength < 4) {
      return !teen && endsWithOne ? 1 : 2
    }
    if (!teen && endsWithOne) {
      return 1
    }
    if (!teen && choice % 10 >= 2 && choice % 10 <= 4) {
      return 2
    }
    return 3
  },
  /**
   * Arabic CLDR pluralization rule, with the zero form first:
   * 0: zero, 1: one, 2: two, 3..10: few, 11..99: many, 100+: other (by the last two digits)
   */
  ar: function (choice, choicesLength) {
    if (choice === 0) {
      return 0
    }
    let index
    if (choice === 1) {
      index = 1
    } else if (choice === 2) {
      index = 2
    } else {
      const mod100 = choice % 100
      if (mod100 >= 3 && mod100 <= 10) {
        index = 3
      } else if (mod100 >= 11 && mod100 <= 99) {
        index = 4
      } else {
        index = 5
      }
    }
    return Math.min(index, choicesLength - 1)
  },
  /**
   * French pluralization rule (0 and 1 are singular)
   */
  fr: function (choice, choicesLength) {
    if (choicesLength === 1) return 0
    if (choicesLength === 2) return choice <= 1 ? 0 : 1
    if (choice === 0) return 0
    if (choice === 1) return 1
    return 2
  }
}

export const i18n = createI18n({
  locale: DEFAULT_LOCALE,
  fallbackLocale: FALLBACK_LOCALE,
  messages: { ar, de, en, es, fr, ja, ru, zh },
  // The remaining HTML-bearing messages are rendered by SafeHtml, which rebuilds an allowlisted
  // VNode tree instead of injecting markup. vue-i18n cannot see that rendering boundary and would
  // otherwise emit false-positive legacy HTML warnings for these messages. The
  // i18nHtmlContract spec blocks new HTML-bearing messages without a SafeHtml consumer.
  warnHtmlMessage: false,
  fallbackRoot: true,
  // Composition mode reads `pluralRules`; the legacy `pluralizationRules` option is ignored here.
  pluralRules,
  silentTranslationWarn: true,
  globalInjection: true,
  allowComposition: true,
  legacy: false
})

/**
 * Applies a locale to vue-i18n, dayjs and the document `lang`/`dir` attributes.
 * The store keeps the selected locale; this is the only place that applies it.
 * @param {unknown} locale
 * @returns {string} The applied, supported locale
 */
export function applyLocale(locale) {
  const supported = normalizeLocale(locale)

  i18n.global.locale.value = supported
  dayjs.locale(DAYJS_LOCALES[supported])

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', supported)
    document.documentElement.setAttribute('dir', isRtlLocale(supported) ? 'rtl' : 'ltr')
  }

  return supported
}
