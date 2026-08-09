import { CryptosInfo } from '@/lib/constants'

/**
 * The single source of truth for which URI schemes the application is willing to render as a
 * link, hand to `SafeHtml`, or pass to the operating system.
 *
 * There used to be three hardcoded copies of this list — in the markdown link renderer, in
 * `SafeHtml` and in `openExternalLink` — and they had already drifted from the wallet
 * specification: `ethereum:`, `dash:`, `doge:` and the app's own `adm:` were missing, so a URI
 * the app itself produces for those coins would not have been clickable in a message.
 *
 * Coin schemes are derived from `CryptosInfo` rather than listed, so adding a coin to
 * `adamant-wallets` cannot leave this behind again.
 */

/** Web and messaging schemes that are not tied to a coin */
const BASE_SCHEMES = [
  'http',
  'https',
  'ftp',
  'sftp',
  'mailto',
  'magnet',
  'tg',
  // Not registered schemes, kept because messages sent before this list existed may use them
  'tor',
  'onion',
  'bch',
  'eth'
] as const

/**
 * `qqPrefix` — note the spelling, it is `qq` in the wallet specification — is the URI scheme a
 * coin uses in QR codes and share links. Every ERC-20 token maps to `ethereum`.
 */
function collectCoinSchemes(): string[] {
  return Object.values(CryptosInfo)
    .map((crypto) => crypto.qqPrefix)
    .filter((prefix): prefix is string => typeof prefix === 'string' && prefix.length > 0)
    .map((prefix) => prefix.toLowerCase())
}

export const ALLOWED_URI_SCHEMES: readonly string[] = [
  ...new Set([...BASE_SCHEMES, ...collectCoinSchemes()])
].sort()

/** Matches a URI whose scheme is on the allowlist. Longest first so `eth` cannot shadow `ethereum` */
export const ALLOWED_URI_SCHEME_PATTERN = new RegExp(
  `^(${[...ALLOWED_URI_SCHEMES].sort((a, b) => b.length - a.length).join('|')}):`,
  'i'
)

/** Colon-suffixed form, for comparing against `URL.protocol` */
export const ALLOWED_URI_PROTOCOLS: ReadonlySet<string> = new Set(
  ALLOWED_URI_SCHEMES.map((scheme) => `${scheme}:`)
)

/**
 * Removes the characters browsers ignore when they resolve a URL, so that a scheme cannot be
 * hidden behind them (`java\tscript:`, `java\nscript:`, leading spaces).
 */
export function stripIgnoredUriChars(uri: string): string {
  return Array.from(uri)
    .filter((character) => character.charCodeAt(0) > 0x20)
    .join('')
}

/** Whether the URI uses a scheme the application is willing to follow */
export function hasAllowedUriScheme(uri: string): boolean {
  return ALLOWED_URI_SCHEME_PATTERN.test(stripIgnoredUriChars(uri))
}
