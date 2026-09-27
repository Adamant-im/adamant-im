// @vitest-environment node

import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  SUPPORTED_LOCALES,
  RTL_LOCALES,
  DEFAULT_LOCALE,
  detectLocale,
  isRtlLocale,
  matchSupportedLocale,
  normalizeLocale
} from '@/i18n'

const projectRoot = fileURLToPath(new URL('../../../', import.meta.url))
const localesDir = path.join(projectRoot, 'src/locales')

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, fullPath))
    } else {
      result[fullPath] = String(value)
    }
  }
  return result
}

const loadLocale = (locale: string) =>
  flattenObject(JSON.parse(readFileSync(path.join(localesDir, `${locale}.json`), 'utf8')))

const enFlat = loadLocale('en')
const enKeys = Object.keys(enFlat).sort()

/** Messages selected by count; every other message must not contain the `|` separator */
const pluralKeys = new Set([
  'chats.file',
  'notifications.tabMessage.few',
  'transaction.addresses',
  'transaction.me_and_addresses'
])

/** Plural forms a locale needs; other locales keep the English number of forms */
const pluralFormCount: Record<string, number> = { ar: 6, ru: 4 }

const allowedHtmlKeys = new Set([
  'login.new_passphrase_label',
  'nodes.nodeLabelDescription',
  'scan.no_stream_details',
  'transfer.confirm_message',
  'transfer.confirm_message_with_name',
  'votes.stake_info',
  'votes.summary_info'
])

/**
 * Links a translation may use instead of the English one for the same message, because a
 * localized page exists. Any other link in a translation fails the contract: translations are
 * contributed by the community and must not be able to point users to a different site.
 */
const localizedLinks: Record<string, Record<string, string[]>> = {
  de: {
    'home.free_tokens_link': ['https://adamant.im/de-free-adm-tokens/']
  },
  ru: {
    'chats.how_to_use_messenger_link': [
      'https://vk.com/@adamant_im-kak-polzovatsya-messendzherom-na-blokcheine'
    ],
    'chats.virtual.welcome_message': ['https://adamant.im/ru-staysecured'],
    'home.buy_tokens_btn_link': ['https://adamant.im/ru-buy-tokens/'],
    'home.free_tokens_link': ['https://adamant.im/ru-free-adm-tokens/']
  }
}

/** Messages that legitimately stay identical to English: names, tickers and loanwords */
const untranslatedAllowlist: Record<string, string[]> = {
  ar: ['app_title', 'login.brand_title', 'build_info.pull_request'],
  de: [
    'app_title',
    'bottom.chats_button',
    'build_info.branch',
    'build_info.commit',
    'build_info.dialog_title',
    'build_info.pull_request',
    'build_info.testnet',
    'build_info.version',
    'chats.title',
    'chats.virtual.adelina_title',
    'dev_screens.adamant_wallets',
    'login.brand_title',
    'login.password_label',
    'nodes.coin',
    'nodes.host',
    'nodes.offline',
    'nodes.ping',
    'nodes.socket',
    'options.chats_title',
    'options.export_keys.passphrase',
    'scan.no_stream_details',
    'transaction.status',
    'votes.delegate_link',
    'votes.table_head_name',
    'wallets.blockchain'
  ],
  es: [
    'app_title',
    'bottom.chats_button',
    'build_info.commit',
    'build_info.dialog_title',
    'build_info.pull_request',
    'build_info.testnet',
    'chats.title',
    'chats.virtual.adelina_title',
    'dev_screens.adamant_wallets',
    'error',
    'login.brand_title',
    'nodes.host',
    'nodes.ping',
    'nodes.socket',
    'options.chats_title',
    'options.general_title',
    'transaction.statuses.REJECTED',
    'wallets.blockchain'
  ],
  fr: [
    'app_title',
    'build_info.commit',
    'build_info.dialog_title',
    'build_info.pull_request',
    'build_info.testnet',
    'build_info.version',
    'chats.message',
    'chats.virtual.adelina_title',
    'dev_screens.adamant_wallets',
    'dev_vibrations.long',
    'dev_wallets.configuration',
    'login.brand_title',
    'nodes.label',
    'nodes.ping',
    'nodes.service',
    'nodes.socket',
    'options.actions',
    'options.notification_title',
    'transaction.confirmations',
    'transaction.date',
    'transaction.transactions',
    'votes.delegate_description',
    'votes.page_title',
    'votes.table_head_vote',
    'wallets.blockchain'
  ],
  ja: [
    'app_title',
    'build_info.dialog_title',
    'build_info.pull_request',
    'build_info.testnet',
    'chats.virtual.adelina_title',
    'dev_screens.adamant_wallets',
    'login.brand_title',
    'nodes.ping',
    'wallets.blockchain'
  ],
  ru: ['build_info.dialog_title', 'dev_screens.adamant_wallets'],
  zh: [
    'app_title',
    'build_info.dialog_title',
    'build_info.pull_request',
    'chats.virtual.adelina_title',
    'dev_screens.adamant_wallets',
    'login.brand_title',
    'nodes.ping'
  ]
}

const placeholders = (message: string) =>
  [...message.matchAll(/\{\s*([\w-]+)\s*\}/g)].map((match) => match[1]).sort()

const markupTags = (message: string) =>
  (message.match(/<[^>]*>/g) ?? []).map((tag) => tag.replace(/\s+/g, ' ')).sort()

/**
 * Everything a browser or the markdown renderer could turn into a link: URLs with a scheme,
 * `www.` hosts and bare domains. Non-ASCII characters are kept, so a CJK full stop glued to a
 * URL (which the markdown autolinker would include in the link) shows up as a different link.
 */
const LINK_PATTERN =
  /(?:[a-z][a-z0-9+.-]*:\/\/|www\.)[^\s"'<>()[\]]+|(?<![@\w.-])(?:[a-z0-9-]+\.)+[a-z]{2,}(?![\w-])/gi

/** vue-i18n literal interpolation, such as `{'@'}`, renders the quoted text as is */
const unescapeLiterals = (message: string) => message.replace(/\{'([^']*)'\}/g, '$1')

const links = (message: string) =>
  (unescapeLiterals(message).match(LINK_PATTERN) ?? []).map((link) =>
    link.replace(/[.,!?;:]+$/, '')
  )

describe('locale files', () => {
  it('register exactly the locales that have a file in src/locales', () => {
    const files = readdirSync(localesDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.basename(file, '.json'))
      .sort()

    expect(SUPPORTED_LOCALES).toEqual(files)
    expect(RTL_LOCALES).toEqual(['ar'])
  })

  it('use `|` only in the registered plural messages', () => {
    const unexpectedPlurals = enKeys.filter((key) => enFlat[key].includes('|'))

    expect(unexpectedPlurals.sort()).toEqual([...pluralKeys].sort())
  })

  it('have unique, non-empty language names', () => {
    const titles = SUPPORTED_LOCALES.map((locale) => loadLocale(locale).title)

    expect(titles.every(Boolean)).toBe(true)
    expect(new Set(titles).size).toBe(titles.length)
  })
})

describe.each(SUPPORTED_LOCALES)('locale %s', (locale) => {
  const flat = loadLocale(locale)
  const keys = Object.keys(flat).sort()

  it('has exactly the keys of en.json', () => {
    const missing = enKeys.filter((key) => !(key in flat))
    const extra = keys.filter((key) => !(key in enFlat))

    expect(missing, `Missing keys in ${locale}`).toEqual([])
    expect(extra, `Extra keys in ${locale}`).toEqual([])
  })

  it('keeps the interpolation placeholders of en.json', () => {
    const mismatches = enKeys
      .filter((key) => !pluralKeys.has(key))
      .filter((key) => placeholders(enFlat[key]).join() !== placeholders(flat[key]).join())
      .map((key) => ({ key, en: placeholders(enFlat[key]), [locale]: placeholders(flat[key]) }))

    expect(mismatches, `Placeholder mismatches in ${locale}`).toEqual([])
  })

  it('has the plural forms its pluralization rule selects from', () => {
    for (const key of pluralKeys) {
      const forms = flat[key].split('|')
      const expectedCount = pluralFormCount[locale] ?? enFlat[key].split('|').length
      const allowedPlaceholders = new Set(placeholders(enFlat[key]))

      expect(forms, `${locale}:${key}`).toHaveLength(expectedCount)
      forms.forEach((form) => {
        placeholders(form).forEach((name) => expect(allowedPlaceholders).toContain(name))
      })
    }
  })

  it('contains HTML only in allowlisted SafeHtml messages, with the markup of en.json', () => {
    const htmlKeys = keys.filter((key) => /<\/?[a-z][^>]*>/i.test(flat[key]))

    expect(htmlKeys.filter((key) => !allowedHtmlKeys.has(key))).toEqual([])

    for (const key of allowedHtmlKeys) {
      expect(markupTags(flat[key]), `${locale}:${key}`).toEqual(markupTags(enFlat[key]))
    }
  })

  it('links only to the destinations of en.json or to allowlisted localized pages', () => {
    for (const key of enKeys) {
      const allowed = new Set([...links(enFlat[key]), ...(localizedLinks[locale]?.[key] ?? [])])
      const found = links(flat[key])

      found.forEach((link) => expect(allowed, `${locale}:${key}`).toContain(link))
      // A dropped link is a dropped instruction, such as the security tips in the welcome message
      expect(found, `${locale}:${key}`).toHaveLength(links(enFlat[key]).length)
    }
  })

  it('translates every message except explicitly allowlisted names and loanwords', () => {
    if (locale === 'en') return

    const identical = enKeys.filter(
      (key) =>
        flat[key] === enFlat[key] &&
        /[A-Za-z]{3,}/.test(enFlat[key]) &&
        links(enFlat[key]).join('') !== enFlat[key]
    )

    expect(identical).toEqual([...(untranslatedAllowlist[locale] ?? [])].sort())
  })

  it('keeps the section structure of the welcome message', () => {
    const headings = (message: string) => message.match(/^# /gm)?.length ?? 0
    const key = 'chats.virtual.welcome_message'

    expect(headings(flat[key])).toBe(headings(enFlat[key]))
  })

  it('names the ADAMANT wallet without repeating the brand', () => {
    const affixes =
      flat['home.wallet_crypto_adamant_prefix'] + flat['home.wallet_crypto_adamant_suffix']

    expect(affixes).not.toMatch(/adamant/i)
  })

  it('has a canonical date locale tag', () => {
    expect(Intl.getCanonicalLocales(flat.region)).toEqual([flat.region])
  })
})

describe('locale helpers', () => {
  it('detects RTL locales', () => {
    expect(SUPPORTED_LOCALES.filter(isRtlLocale)).toEqual(['ar'])
  })

  it('maps BCP 47 tags to supported locales and keeps saved codes such as `zh`', () => {
    expect(matchSupportedLocale('zh')).toBe('zh')
    expect(matchSupportedLocale('zh-CN')).toBe('zh')
    expect(matchSupportedLocale('zh-Hant-TW')).toBe('zh')
    expect(matchSupportedLocale('ar-EG')).toBe('ar')
    expect(matchSupportedLocale('pt_BR')).toBeNull()
    expect(matchSupportedLocale(undefined)).toBeNull()

    expect(normalizeLocale('ja-JP')).toBe('ja')
    expect(normalizeLocale('unknown-locale')).toBe(DEFAULT_LOCALE)
    expect(normalizeLocale(null)).toBe(DEFAULT_LOCALE)
  })

  it('detects the first supported browser language and falls back to the default', () => {
    expect(detectLocale(['uk-UA', 'ru-RU', 'en-US'])).toBe('ru')
    expect(detectLocale(['zh-TW'])).toBe('zh')
    expect(detectLocale(['pt-BR', 'it'])).toBe(DEFAULT_LOCALE)
    expect(detectLocale([])).toBe(DEFAULT_LOCALE)
  })
})
