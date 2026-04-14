import { describe, expect, it } from 'vitest'

import { formatMessageBasic, renderMarkdown } from './markdown'

describe('markdown helpers', () => {
  it('sanitizes script tags before rendering', () => {
    const rendered = renderMarkdown('<script>alert(1)</script><p>safe</p>')

    expect(rendered).not.toContain('<script')
    expect(rendered).toContain('<p>safe</p>')
  })

  it('keeps allowed links and strips unsafe protocols', () => {
    const safeRendered = renderMarkdown('[safe](https://example.com)')
    const unsafeRendered = renderMarkdown('[unsafe](javascript:alert(1))')

    expect(safeRendered).toContain('href="https://example.com"')
    expect(safeRendered).toContain('target="_blank"')
    expect(safeRendered).toContain('rel="noopener noreferrer"')
    expect(unsafeRendered).not.toContain('javascript:')
    expect(unsafeRendered).not.toContain('href=')
  })

  it('does not produce inline JavaScript event handlers in rendered links', () => {
    const rendered = renderMarkdown('[click me](https://example.com)')

    expect(rendered).not.toContain('onClick')
    expect(rendered).not.toContain('window.open')
  })

  it('neutralizes href injection that targeted inline JS string context', () => {
    // The old renderer interpolated href into onClick="window.open('${href}')" without escaping,
    // allowing single-quote injection to break out of the JS string literal and run arbitrary JS.
    // The fix removes the onClick/window.open pattern entirely.
    const rendered = renderMarkdown("[x](https://evil.com'); alert(1); (')")

    // alert(1) may appear as inert plain text — the critical check is that it is not
    // embedded inside an event handler or script tag where it would execute.
    expect(rendered).not.toContain('window.open')
    expect(rendered).not.toContain('onClick')
    expect(rendered).not.toMatch(/on\w+\s*=/)
  })

  it('preserves href for custom protocols used in crypto and deep links', () => {
    // These protocols match renderer.link's linkPattern and must not be stripped by DOMPurify.
    const protocols = [
      ['eth', 'eth:0xABCDEF'],
      ['bch', 'bch:qaddress'],
      ['bitcoin', 'bitcoin:1A2B3C'],
      ['magnet', 'magnet:?xt=urn:test'],
      ['tg', 'tg:resolve?domain=test'],
      ['sftp', 'sftp://example.com/file']
    ]

    for (const [name, uri] of protocols) {
      const rendered = renderMarkdown(`[${name} link](${uri})`)
      expect(rendered, `href for ${name}: should be present`).toContain(`href="${uri}"`)
    }
  })

  it('normalizes line separators and strips markdown heading markers in preview text', () => {
    const formatted = formatMessageBasic('# Heading\u2028Line two')

    expect(formatted).toBe('Heading\u21b5 Line two\n')
  })
})
