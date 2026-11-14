import { afterEach, describe, expect, it, vi } from 'vitest'
import dayjs from 'dayjs'

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, applyLocale, i18n } from '@/i18n'
import { renderMarkdown } from '@/lib/markdown'
import en from '@/locales/en.json'

type Messages = { [key: string]: string | Messages }

const flatten = (messages: Messages, prefix = ''): [string, string][] =>
  Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'string' ? [[`${prefix}${key}`, value]] : flatten(value, `${prefix}${key}.`)
  )

const enMessages = flatten(en as Messages)
const global = i18n.global
const t = (key: string, ...args: unknown[]) =>
  (global.t as (...a: unknown[]) => string)(key, ...args)

afterEach(() => {
  applyLocale(DEFAULT_LOCALE)
  vi.restoreAllMocks()
})

describe('locale messages at runtime', () => {
  it.each(SUPPORTED_LOCALES)('compiles and resolves every %s message', (locale) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    applyLocale(locale)

    for (const [key, enMessage] of enMessages) {
      const names = [...enMessage.matchAll(/\{\s*([\w-]+)\s*\}/g)].map((match) => match[1])
      const params = Object.fromEntries(names.map((name) => [name, `<${name}>`]))
      const result = enMessage.includes('|') ? t(key, 5, params) : t(key, params)

      expect(result, `${locale}:${key}`).not.toBe(key)
      expect(result, `${locale}:${key}`).not.toMatch(/\{\s*[\w-]+\s*\}/)
    }

    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })

  it.each(SUPPORTED_LOCALES)('resolves every %s link message to an HTTPS URL', (locale) => {
    applyLocale(locale)

    for (const [key, enMessage] of enMessages) {
      if (!/^https:\/\/\S+$/.test(enMessage)) continue

      expect(new URL(t(key)).protocol, `${locale}:${key}`).toBe('https:')
      expect(t(key), `${locale}:${key}`).not.toMatch(/[{}'\s]/)
    }
  })

  it.each([
    [0, '0 файлов'],
    [1, '1 файл'],
    [3, '3 файла'],
    [5, '5 файлов'],
    [11, '11 файлов'],
    [21, '21 файл'],
    [22, '22 файла'],
    [111, '111 файлов']
  ])('selects the Russian plural form for %i', (count, expected) => {
    applyLocale('ru')

    expect(t('chats.file', count)).toBe(expected)
  })

  it.each([
    [0, 'لا توجد ملفات'],
    [1, 'ملف واحد'],
    [2, 'ملفان'],
    [3, '3 ملفات'],
    [10, '10 ملفات'],
    [11, '11 ملفًا'],
    [99, '99 ملفًا'],
    [100, '100 ملف'],
    [103, '103 ملفات']
  ])('selects the Arabic plural form for %i', (count, expected) => {
    applyLocale('ar')

    expect(t('chats.file', count)).toBe(expected)
  })

  it('treats zero as singular in French', () => {
    applyLocale('fr')

    expect(t('chats.file', 0)).toBe('0 fichier')
    expect(t('chats.file', 2)).toBe('2 fichiers')
  })
})

describe('applyLocale', () => {
  it('applies the locale to vue-i18n, dayjs and the document', () => {
    expect(applyLocale('ar')).toBe('ar')
    expect(global.locale.value).toBe('ar')
    expect(dayjs.locale()).toBe('ar')
    expect(document.documentElement.getAttribute('lang')).toBe('ar')
    expect(document.documentElement.getAttribute('dir')).toBe('rtl')

    expect(applyLocale('zh')).toBe('zh')
    expect(dayjs.locale()).toBe('zh-cn')
    expect(document.documentElement.getAttribute('dir')).toBe('ltr')
  })

  it('falls back to the default locale for unsupported values', () => {
    applyLocale('ar')

    expect(applyLocale('xx-YY')).toBe(DEFAULT_LOCALE)
    expect(global.locale.value).toBe(DEFAULT_LOCALE)
    expect(document.documentElement.getAttribute('lang')).toBe(DEFAULT_LOCALE)
    expect(document.documentElement.getAttribute('dir')).toBe('ltr')
  })
})

describe('localized chat messages rendered as markdown', () => {
  const virtualChatKeys = enMessages
    .map(([key]) => key)
    .filter((key) => key.startsWith('chats.virtual.'))

  const renderedLinks = (message: string) =>
    [
      ...new DOMParser().parseFromString(renderMarkdown(message), 'text/html').querySelectorAll('a')
    ].map((link) => link.getAttribute('href'))

  const linksIn = (locale: string, key: string) => {
    applyLocale(locale)
    return renderedLinks(t(key))
  }

  // The Russian welcome message links to the Russian version of the security guide
  const localizedHref = (locale: string, href: string | null) =>
    locale === 'ru' ? href?.replace('/staysecured', '/ru-staysecured') : href

  it.each(SUPPORTED_LOCALES)('link %s messages to the same pages as English', (locale) => {
    for (const key of virtualChatKeys) {
      const english = linksIn('en', key).map((href) => localizedHref(locale, href))

      expect(linksIn(locale, key), `${locale}:${key}`).toEqual(english)
    }
  })
})
