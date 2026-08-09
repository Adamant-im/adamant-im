import { describe, expect, it, vi } from 'vitest'

/**
 * `qqPrefix` values are interpolated into two regexes — the scheme allowlist here and
 * DOMPurify's `ALLOWED_URI_REGEXP` in `markdown.ts`. RFC 3986 permits `+`, `.` and `-` in a
 * scheme, and the first two are regex metacharacters, so a perfectly valid future prefix would
 * silently widen what the allowlist matches. A validity filter cannot catch that; escaping can.
 *
 * The specification does not currently contain such a prefix, so one is injected here.
 */
vi.mock('@/lib/constants/cryptos', () => ({
  CryptosInfo: {
    DOTTED: { qqPrefix: 'foo.bar' },
    PLUSED: { qqPrefix: 'baz+qux' },
    NORMAL: { qqPrefix: 'bitcoin' },
    NOT_A_SCHEME: { qqPrefix: 'has space' },
    MISSING: {}
  }
}))

const { ALLOWED_URI_SCHEMES, ALLOWED_URI_SCHEME_ALTERNATION, hasAllowedUriScheme } =
  await import('@/lib/uriSchemes')

describe('URI scheme escaping', () => {
  it('matches a dotted scheme literally, not as a wildcard', () => {
    expect(hasAllowedUriScheme('foo.bar:x')).toBe(true)
    // Unescaped, `.` would make this match too
    expect(hasAllowedUriScheme('fooXbar:x')).toBe(false)
  })

  it('matches a plus scheme literally, not as a repetition', () => {
    expect(hasAllowedUriScheme('baz+qux:x')).toBe(true)
    // Unescaped, `z+` would match one or more `z`
    expect(hasAllowedUriScheme('bazzzqux:x')).toBe(false)
    expect(hasAllowedUriScheme('bazqux:x')).toBe(false)
  })

  it('escapes the metacharacters in the exported alternation', () => {
    expect(ALLOWED_URI_SCHEME_ALTERNATION).toContain('foo\\.bar')
    expect(ALLOWED_URI_SCHEME_ALTERNATION).toContain('baz\\+qux')
  })

  it('still drops values that are not schemes at all', () => {
    expect(ALLOWED_URI_SCHEMES).not.toContain('has space')
  })

  it('leaves ordinary schemes working', () => {
    expect(hasAllowedUriScheme('bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')).toBe(true)
    expect(hasAllowedUriScheme('javascript:alert(1)')).toBe(false)
  })
})
