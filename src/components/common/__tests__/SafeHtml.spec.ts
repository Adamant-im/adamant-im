import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SafeHtml from '../SafeHtml'
import {
  XSS_PAYLOADS,
  ALL_XSS_PAYLOADS,
  findExecutableMarkup
} from '@/lib/__fixtures__/xssPayloads'

function render(html: string, profile: 'message' | 'ui' = 'message') {
  return mount(SafeHtml, { props: { html, profile } })
}

describe('SafeHtml', () => {
  it('never emits executable markup for any known payload', () => {
    for (const payload of ALL_XSS_PAYLOADS) {
      const output = render(payload).html()

      expect(findExecutableMarkup(output), `payload: ${payload}`).toEqual([])
    }
  })

  it('drops event handler attributes even when the input still carries them', () => {
    // Simulates an upstream sanitizer bypass: the sink itself must not be able to create
    // an event handler.
    const wrapper = render('<b onclick="alert(1)" onmouseover="alert(2)">text</b>')

    expect(wrapper.html()).not.toContain('onclick')
    expect(wrapper.html()).not.toContain('onmouseover')
    expect(wrapper.text()).toBe('text')
  })

  it('drops script and style elements together with their content', () => {
    const wrapper = render('<style>body{display:none}</style><script>alert(1)</script>after')

    expect(wrapper.text()).toBe('after')
  })

  it('drops form controls together with their labels', () => {
    // Keeping the text would still let a message paint something that reads like a login
    // prompt, so the whole subtree goes.
    const wrapper = render('<form action="https://evil.com"><button>Login</button></form>')

    expect(wrapper.html()).not.toContain('<form')
    expect(wrapper.html()).not.toContain('<button')
    expect(wrapper.text()).toBe('')
  })

  it('unwraps an unknown non-form wrapper but keeps its text', () => {
    const wrapper = render('<article><section>readable</section></article>')

    expect(wrapper.html()).not.toContain('<article')
    expect(wrapper.text()).toBe('readable')
  })

  it('never renders an element that would fetch a remote resource', () => {
    const wrapper = render('<img src="https://evil.example/pixel.png" alt="x">text')

    expect(wrapper.html()).not.toContain('<img')
    expect(wrapper.html()).not.toContain('evil.example')
    expect(wrapper.text()).toBe('text')
  })

  it('wraps a table in its own scroll container', () => {
    // Without the wrapper the table shrinks to the bubble width instead of scrolling
    const wrapper = render(
      '<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>'
    )

    expect(wrapper.html()).toContain('class="a-chat__message-table"')
    expect(wrapper.html()).toContain('<table>')
    expect(wrapper.html()).toContain('<td>1</td>')
    expect(wrapper.find('.a-chat__message-table > table').exists()).toBe(true)
  })

  it('does not let a message forge the table wrapper class', () => {
    // The wrapper class is added by the component; `class` from message content stays banned
    const wrapper = render('<span class="a-chat__message-table">x</span>')

    expect(wrapper.html()).not.toContain('a-chat__message-table')
  })

  it('keeps allowed formatting elements', () => {
    const wrapper = render('<p>a <b>bold</b> and <em>italic</em><br><code>code</code></p>')

    expect(wrapper.html()).toContain('<b>bold</b>')
    expect(wrapper.html()).toContain('<em>italic</em>')
    expect(wrapper.html()).toContain('<br>')
    expect(wrapper.html()).toContain('<code>code</code>')
  })

  it('renders allowed links with noopener and drops unsafe schemes', () => {
    const safe = render('<a href="https://example.com">link</a>')

    expect(safe.html()).toContain('href="https://example.com"')
    expect(safe.html()).toContain('rel="noopener noreferrer"')

    const unsafe = render('<a href="javascript:alert(1)">link</a>')

    expect(unsafe.html()).not.toContain('href')
    expect(unsafe.text()).toBe('link')
  })

  it('rejects schemes hidden behind ignored characters', () => {
    const wrapper = render(XSS_PAYLOADS.javascriptUriObfuscated)

    expect(wrapper.html()).not.toContain('href')
    expect(wrapper.html().toLowerCase()).not.toContain('script:')
  })

  it('keeps the non-http schemes the app supports', () => {
    for (const href of ['bitcoin:1abc', 'eth:0xabc', 'magnet:?xt=urn', 'tg://resolve', '/local']) {
      const wrapper = render(`<a href="${href}">x</a>`)

      expect(wrapper.html(), href).toContain('href=')
    }
  })

  it('does not allow class on message content', () => {
    const wrapper = render(XSS_PAYLOADS.overlayByClass)

    expect(wrapper.html()).not.toContain('position-fixed')
    expect(wrapper.text()).toBe('FAKE')
  })

  it('allows class in the ui profile, for bundled i18n strings', () => {
    const wrapper = render('<span class="address-in-confirm">U123</span>', 'ui')

    expect(wrapper.html()).toContain('class="address-in-confirm"')
  })

  it('never allows style, in either profile', () => {
    for (const profile of ['message', 'ui'] as const) {
      const wrapper = render(XSS_PAYLOADS.overlayByStyle, profile)

      expect(wrapper.html(), profile).not.toContain('position:fixed')
    }
  })

  it('renders the requested wrapper tag', () => {
    expect(render('text').html()).toContain('<div')
    expect(mount(SafeHtml, { props: { html: 'text', tag: 'p' } }).html()).toContain('<p')
  })
})
