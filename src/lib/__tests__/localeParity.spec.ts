// @vitest-environment node

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  SUPPORTED_LOCALES,
  RTL_LOCALES,
  DEFAULT_LOCALE,
  isRtlLocale,
  normalizeLocale,
  pluralizationRules,
  i18n
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

const enRaw = JSON.parse(readFileSync(path.join(localesDir, 'en.json'), 'utf8')) as Record<
  string,
  unknown
>
const enFlat = flattenObject(enRaw)
const enKeys = Object.keys(enFlat).sort()

const pluralKeys = new Set([
  'chats.file',
  'notifications.tabMessage.few',
  'transaction.addresses',
  'transaction.me_and_addresses'
])

const allowedHtmlKeys = new Set([
  'login.new_passphrase_label',
  'nodes.nodeLabelDescription',
  'scan.no_stream_details',
  'transfer.confirm_message',
  'transfer.confirm_message_with_name',
  'votes.stake_info',
  'votes.summary_info'
])

describe('locale parity and quality contract', () => {
  it('registers all 8 languages in SUPPORTED_LOCALES', () => {
    expect(SUPPORTED_LOCALES).toEqual(['ar', 'de', 'en', 'es', 'fr', 'ja', 'ru', 'zh'])
    expect(RTL_LOCALES).toEqual(['ar'])
  })

  it('verifies canonical en.json contains 416 leaf keys', () => {
    expect(enKeys.length).toBe(416)
  })

  describe.each(SUPPORTED_LOCALES)('locale: %s', (locale) => {
    const filePath = path.join(localesDir, `${locale}.json`)

    it('file exists on disk and is valid JSON', () => {
      expect(existsSync(filePath), `Locale file ${filePath} must exist`).toBe(true)
      expect(() => JSON.parse(readFileSync(filePath, 'utf8'))).not.toThrow()
    })

    const raw = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
    const flat = flattenObject(raw)
    const keys = Object.keys(flat).sort()

    it('has exact key count parity with en.json', () => {
      expect(keys.length).toBe(enKeys.length)
    })

    it('contains no missing or extra keys compared to en.json', () => {
      const missing = enKeys.filter((k) => !(k in flat))
      const extra = keys.filter((k) => !(k in enFlat))

      expect(missing, `Missing keys in ${locale}`).toEqual([])
      expect(extra, `Extra keys in ${locale}`).toEqual([])
    })

    it('preserves all interpolation placeholders from en.json', () => {
      const mismatches: { key: string; enPh: string[]; locPh: string[] }[] = []

      for (const key of enKeys) {
        if (pluralKeys.has(key)) continue

        const enPh = (enFlat[key].match(/\{[a-zA-Z0-9_-]+\}/g) || []).sort()
        const locPh = (flat[key]?.match(/\{[a-zA-Z0-9_-]+\}/g) || []).sort()

        if (enPh.join(',') !== locPh.join(',')) {
          mismatches.push({ key, enPh, locPh })
        }
      }

      expect(mismatches, `Placeholder mismatches in ${locale}`).toEqual([])
    })

    it('contains HTML tags only in allowlisted SafeHtml keys', () => {
      const htmlKeys = keys.filter(
        (k) => typeof flat[k] === 'string' && /<\/?[a-z][^>]*>/i.test(flat[k])
      )
      const unauthorized = htmlKeys.filter((k) => !allowedHtmlKeys.has(k))

      expect(unauthorized, `Unauthorized HTML in ${locale}`).toEqual([])
    })

    it('has valid non-empty title and canonical region', () => {
      expect(flat.title).toBeTruthy()
      expect(flat.region).toBeTruthy()
      expect(() => Intl.getCanonicalLocales(flat.region)).not.toThrow()
    })
  })

  describe('RTL and locale helper functions', () => {
    it('correctly identifies RTL locales', () => {
      expect(isRtlLocale('ar')).toBe(true)
      expect(isRtlLocale('en')).toBe(false)
      expect(isRtlLocale('ru')).toBe(false)
      expect(isRtlLocale('de')).toBe(false)
      expect(isRtlLocale('es')).toBe(false)
      expect(isRtlLocale('fr')).toBe(false)
      expect(isRtlLocale('ja')).toBe(false)
      expect(isRtlLocale('zh')).toBe(false)
    })

    it('normalizes regional and standard locale strings', () => {
      expect(normalizeLocale('zh-CN')).toBe('zh')
      expect(normalizeLocale('zh-TW')).toBe('zh')
      expect(normalizeLocale('zh')).toBe('zh')
      expect(normalizeLocale('ru-RU')).toBe('ru')
      expect(normalizeLocale('de-DE')).toBe('de')
      expect(normalizeLocale('es-ES')).toBe('es')
      expect(normalizeLocale('fr-FR')).toBe('fr')
      expect(normalizeLocale('ja-JP')).toBe('ja')
      expect(normalizeLocale('ar-SA')).toBe('ar')
      expect(normalizeLocale('en-US')).toBe('en')
      expect(normalizeLocale('unknown-locale')).toBe(DEFAULT_LOCALE)
      expect(normalizeLocale(null as unknown as string)).toBe(DEFAULT_LOCALE)
    })
  })

  describe('pluralization rules', () => {
    const rules = pluralizationRules

    it('evaluates Russian pluralization accurately', () => {
      const ruRule = rules?.ru
      expect(ruRule).toBeDefined()
      if (!ruRule) return

      expect(ruRule(0, 4)).toBe(0) // 0 файлов
      expect(ruRule(1, 4)).toBe(1) // 1 файл
      expect(ruRule(2, 4)).toBe(2) // 2 файла
      expect(ruRule(4, 4)).toBe(2) // 4 файла
      expect(ruRule(5, 4)).toBe(3) // 5 файлов
      expect(ruRule(11, 4)).toBe(3) // 11 файлов (teen)
      expect(ruRule(21, 4)).toBe(1) // 21 файл
      expect(ruRule(24, 4)).toBe(2) // 24 файла
      expect(ruRule(111, 4)).toBe(3) // 111 файлов (teen modulo 100)
    })

    it('evaluates Arabic 6-form CLDR pluralization', () => {
      const arRule = rules?.ar
      expect(arRule).toBeDefined()
      if (!arRule) return

      expect(arRule(0, 6)).toBe(0) // zero
      expect(arRule(1, 6)).toBe(1) // one
      expect(arRule(2, 6)).toBe(2) // two
      expect(arRule(3, 6)).toBe(3) // few (3..10)
      expect(arRule(10, 6)).toBe(3) // few (3..10)
      expect(arRule(11, 6)).toBe(4) // many (11..99)
      expect(arRule(99, 6)).toBe(4) // many (11..99)
      expect(arRule(100, 6)).toBe(5) // other (100+)
      expect(arRule(103, 6)).toBe(3) // few (103 % 100 = 3)
      expect(arRule(115, 6)).toBe(4) // many (115 % 100 = 15)
    })

    it('evaluates French pluralization (0 and 1 are singular)', () => {
      const frRule = rules?.fr
      expect(frRule).toBeDefined()
      if (!frRule) return

      expect(frRule(0, 2)).toBe(0)
      expect(frRule(1, 2)).toBe(0)
      expect(frRule(2, 2)).toBe(1)
      expect(frRule(10, 2)).toBe(1)
    })
  })
})
