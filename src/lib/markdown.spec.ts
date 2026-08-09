import { describe, expect, it } from 'vitest'

import {
  escapeHtml,
  formatChatPreviewMessage,
  formatMessageBasic,
  renderMarkdown,
  renderPlainText
} from './markdown'
import { ALL_XSS_PAYLOADS, XSS_PAYLOADS, findExecutableMarkup } from './__fixtures__/xssPayloads'

describe('renderMarkdown', () => {
  it('sanitizes the HTML the parser produces, not the markdown source', () => {
    // Sanitizing the source is a no-op: at that point the text is not HTML yet.
    for (const payload of ALL_XSS_PAYLOADS) {
      const rendered = renderMarkdown(payload)

      expect(findExecutableMarkup(rendered), `payload: ${payload}`).toEqual([])
    }
  })

  it('does not let a link target break out of its attribute', () => {
    const rendered = renderMarkdown(XSS_PAYLOADS.linkAttributeBreakout)
    const anchor = new DOMParser().parseFromString(rendered, 'text/html').querySelector('a')

    // The quote stays inside the href value instead of starting a second attribute
    expect(findExecutableMarkup(rendered)).toEqual([])
    expect(
      anchor &&
        Array.from(anchor.attributes)
          .map((a) => a.name)
          .sort()
    ).toEqual(['href', 'rel', 'target'])
  })

  it('does not emit inline event handlers for ordinary links', () => {
    const rendered = renderMarkdown('[click](https://example.com)')

    expect(rendered).not.toContain('onClick')
    expect(rendered).toContain('href="https://example.com"')
    expect(rendered).toContain('rel="noopener noreferrer"')
  })

  it('strips unsafe protocols from links', () => {
    const rendered = renderMarkdown(XSS_PAYLOADS.javascriptUri)

    expect(rendered).not.toContain('<a')
    expect(findExecutableMarkup(rendered)).toEqual([])
  })

  it('keeps the non-http protocols the app supports', () => {
    for (const uri of ['bitcoin:1abc', 'eth:0xabc', 'magnet:?xt=urn:btih:abc', 'tg:resolve']) {
      expect(renderMarkdown(`[x](${uri})`), uri).toContain('href=')
    }
  })

  it('keeps supported markdown formatting', () => {
    const rendered = renderMarkdown('**bold** _italic_\n\n- one\n- two\n\n# Heading')

    expect(rendered).toContain('<strong>bold</strong>')
    expect(rendered).toContain('<em>italic</em>')
    expect(rendered).toContain('<li>one</li>')
    expect(rendered).toContain('<h1>Heading</h1>')
  })

  it('never emits class or style attributes on message content', () => {
    for (const payload of [XSS_PAYLOADS.overlayByClass, XSS_PAYLOADS.overlayByStyle]) {
      const parsed = new DOMParser().parseFromString(renderMarkdown(payload), 'text/html')
      const attributes = Array.from(parsed.body.querySelectorAll('*')).flatMap((element) =>
        Array.from(element.attributes).map((attribute) => attribute.name)
      )

      // The raw HTML is shown as text, so the words still appear — as content, not as markup
      expect(attributes, payload).not.toContain('class')
      expect(attributes, payload).not.toContain('style')
    }
  })

  it('renders raw HTML from the source as text instead of passing it through', () => {
    const rendered = renderMarkdown('<div onclick=alert(1)>raw</div>')

    expect(rendered).toContain('&lt;div')
    expect(new DOMParser().parseFromString(rendered, 'text/html').querySelector('div')).toBeNull()
  })

  it('keeps the rest of markdown: tables, task lists, strikethrough, quotes', () => {
    const rendered = renderMarkdown(
      '| a | b |\n|---|---|\n| 1 | 2 |\n\n- [ ] todo\n- [x] done\n\n~~gone~~\n\n> quote'
    )

    expect(rendered).toContain('<table>')
    expect(rendered).toContain('<td>1</td>')
    expect(rendered).toContain('<del>gone</del>')
    expect(rendered).toContain('<blockquote>')
    // Task list state is a character, never a form control
    expect(rendered).toContain('\u2610')
    expect(rendered).toContain('\u2611')
    expect(rendered).not.toContain('<input')
  })

  it('never emits an element that would fetch a remote resource', () => {
    const rendered = renderMarkdown('![alt](https://evil.example/pixel.png)\n\n<img src=x>')

    expect(rendered).not.toContain('<img')
    expect(rendered).not.toContain('evil.example')
  })

  it('runs headings through the same escaping as the rest of the message', () => {
    // `renderer.heading` used to emit the raw source text, so raw HTML in a heading reached the
    // output as markup while the same HTML in a paragraph was escaped
    const rendered = renderMarkdown('# <b>hi</b>')

    expect(rendered).toContain('&lt;b&gt;')
    expect(new DOMParser().parseFromString(rendered, 'text/html').querySelector('h1 b')).toBeNull()
  })

  it('renders inline markdown inside headings', () => {
    const rendered = renderMarkdown('# **bold** and `code`')

    expect(rendered).toContain('<strong>bold</strong>')
    expect(rendered).toContain('<code>code</code>')
  })

  it('never emits executable markup from a heading', () => {
    for (const payload of [XSS_PAYLOADS.headingWithTag, XSS_PAYLOADS.headingWithEntities]) {
      expect(findExecutableMarkup(renderMarkdown(payload)), payload).toEqual([])
    }
  })

  it('normalizes the U+2028 line separator', () => {
    expect(renderMarkdown('a\u2028b')).toContain('<br>')
  })
})

describe('renderPlainText', () => {
  it('escapes markup so an unformatted message cannot bring its own HTML', () => {
    for (const payload of ALL_XSS_PAYLOADS) {
      const rendered = renderPlainText(payload)

      expect(rendered, `payload: ${payload}`).not.toContain('<')
    }
  })

  it('leaves readable text intact', () => {
    expect(renderPlainText('a & b')).toBe('a &amp; b')
  })
})

describe('escapeHtml', () => {
  it('escapes every character that can change markup structure', () => {
    expect(escapeHtml(`<>&"'`)).toBe('&lt;&gt;&amp;&quot;&#39;')
  })
})

describe('formatMessageBasic', () => {
  it('returns plain text, never markup', () => {
    // The result is rendered as text. This test documents that the function decodes
    // entities by design, which is exactly why its output must not reach an HTML sink.
    expect(formatMessageBasic(XSS_PAYLOADS.entityEncodedTag)).not.toContain('&lt;')
    // Raw HTML in the source is now shown to the user as the text they were sent, instead of
    // silently vanishing from the preview
    expect(formatMessageBasic(XSS_PAYLOADS.rawTag)).toBe(XSS_PAYLOADS.rawTag)
  })

  it('normalizes line separators and strips markdown heading markers in preview text', () => {
    expect(formatMessageBasic('# Heading\u2028Line two')).toBe('Heading↵ Line two')
  })

  it('keeps block structure instead of collapsing the message before parsing', () => {
    // Replacing newlines with the visual symbol first made the parser see a single line, so
    // only the first list marker was stripped and the rest leaked into the preview
    expect(formatMessageBasic('- one\n- two\n  - nested')).toBe('one↵ two↵ nested')
    expect(formatMessageBasic('- [ ] todo\n- [x] done')).toBe('☐ todo↵ ☑ done')
    expect(formatMessageBasic('> quoted\n> second')).toBe('quoted↵ second')
  })

  it('flattens nested quotes without leaking the markers', () => {
    const formatted = formatMessageBasic('> outer\n>\n> > inner')

    expect(formatted).toBe('outer↵ inner')
    expect(formatted).not.toContain('>')
  })

  it('does not leak the language tag out of a fenced code block', () => {
    expect(formatMessageBasic('```js\nconst a = 1\n```')).toBe('const a = 1')
  })

  it('renders table cells on one line per row', () => {
    expect(formatMessageBasic('| a | b |\n|---|---|\n| 1 | 2 |')).toBe('a b↵ 1 2')
  })

  it('has no leading or trailing whitespace', () => {
    for (const source of ['- item', '> quote', '# heading', 'plain', '```\ncode\n```']) {
      const formatted = formatMessageBasic(source)

      expect(formatted, source).toBe(formatted.trim())
    }
  })
})

describe('formatChatPreviewMessage', () => {
  it('returns plain text without wrapping the line-break symbol in markup', () => {
    const formatted = formatChatPreviewMessage('one\ntwo')

    expect(formatted).not.toContain('<span')
    expect(formatted).toContain('↵')
  })
})
