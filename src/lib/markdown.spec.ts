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

    expect(safeRendered).toContain("window.open('https://example.com'")
    expect(unsafeRendered).not.toContain('javascript:')
    expect(unsafeRendered).not.toContain('window.open(')
  })

  it('normalizes line separators and strips markdown heading markers in preview text', () => {
    const formatted = formatMessageBasic('# Heading\u2028Line two')

    expect(formatted).toBe('Heading\u21b5 Line two\n')
  })
})
