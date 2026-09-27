import { createI18n } from 'vue-i18n'

import ar from './locales/ar.json'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import ja from './locales/ja.json'
import ru from './locales/ru.json'
import zh from './locales/zh.json'

export const SUPPORTED_LOCALES = ['ar', 'de', 'en', 'es', 'fr', 'ja', 'ru', 'zh']
export const RTL_LOCALES = ['ar']

export function isRtlLocale(locale) {
  return RTL_LOCALES.includes(locale)
}

export function normalizeLocale(locale) {
  if (!locale || typeof locale !== 'string') return DEFAULT_LOCALE
  const lower = locale.toLowerCase()
  if (lower.startsWith('zh')) return 'zh'
  const primary = lower.split(/[-_]/)[0]
  return SUPPORTED_LOCALES.includes(primary) ? primary : DEFAULT_LOCALE
}

export function applyLocaleToDocument(locale) {
  if (typeof document === 'undefined') return
  const isRtl = isRtlLocale(locale)
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr')
  document.documentElement.setAttribute('lang', locale)
}

function loadLocaleMessages() {
  return {
    ar,
    de,
    en,
    es,
    fr,
    ja,
    ru,
    zh
  }
}

export const DEFAULT_LOCALE = import.meta.env.VITE_I18N_LOCALE || 'en'
export const FALLBACK_LOCALE = import.meta.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en'

export const pluralizationRules = {
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
    return choicesLength < 4 ? 2 : 3
  },
  /**
   * Arabic CLDR 6-form pluralization rule
   * 0: zero, 1: one, 2: two, 3..10: few, 11..99: many, 100+: other
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
  messages: loadLocaleMessages(),
  // The remaining HTML-bearing messages are rendered by SafeHtml, which rebuilds an allowlisted
  // VNode tree instead of injecting markup. vue-i18n cannot see that rendering boundary and would
  // otherwise emit false-positive legacy HTML warnings for these messages. The
  // i18nHtmlContract spec blocks new HTML-bearing messages without a SafeHtml consumer.
  warnHtmlMessage: false,
  fallbackRoot: true,
  pluralizationRules,
  silentTranslationWarn: true,
  globalInjection: true,
  allowComposition: true,
  legacy: false
})
