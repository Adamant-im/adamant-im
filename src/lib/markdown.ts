import { Marked } from 'marked'
import DOMPurify, { type Config as DOMPurifyConfig } from 'dompurify'

import { ALLOWED_URI_SCHEMES, hasAllowedUriScheme } from '@/lib/uriSchemes'

// The U+2028 character (LINE SEPARATOR) is sometimes used as a line break, but it is treated as a space in some web environments,
// causing unexpected rendering issues. To avoid this, it's recommended to replace it with a standard line break character such as `\n`.
const LINE_SEPARATOR = /\u2028/g

// LINE_BREAK_SYMBOL is used for formatting when the message is displayed as a single line in a preview.
// It replaces line breaks with a visual symbol (↵) to indicate where new lines exist in the original text.
export const LINE_BREAK_SYMBOL = '↵'
const LINE_BREAK_VISUAL = `${LINE_BREAK_SYMBOL} `

/** Everything outside the shared scheme allowlist is rendered as plain text */
const EMAIL_PATTERN = /^(mailto):[^@]+@[^@]+\.[^@]+$/i

/**
 * Applied to the HTML produced by `marked`, never to the markdown source.
 *
 * Sanitizing the source instead of the output is the mistake this configuration exists to
 * prevent: at that point the text is not HTML yet, so the sanitizer sees nothing to remove
 * and the markup the parser generates afterwards is never inspected.
 *
 * No `class` is allowed: the application ships utility classes that could be combined into a
 * full-viewport overlay. No `style` is allowed for the same reason.
 */
const MARKDOWN_SANITIZE_CONFIG: DOMPurifyConfig = {
  // Everything `marked` can emit for the markdown we support, and nothing else.
  // No `img` (the messenger never fetches a remote resource, which would leak the reader's
  // IP to the sender) and no `input` (a chat message must not contain a form control).
  ALLOWED_TAGS: [
    'a',
    'b',
    'blockquote',
    'br',
    'code',
    'del',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'i',
    'li',
    'ol',
    'p',
    'pre',
    's',
    'strong',
    'sub',
    'sup',
    'table',
    'tbody',
    'td',
    'th',
    'thead',
    'tr',
    'ul'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  // `target` and `rel` carry keywords, not URIs. Without this DOMPurify validates them as
  // URIs and strips them.
  ADD_URI_SAFE_ATTR: ['target', 'rel'],
  // Extend the built-in URI allowlist to the same protocols `renderer.link` accepts, so that
  // `eth:`, `bitcoin:`, `magnet:`, `tg:`, `tor:`, `onion:` and `sftp:` links survive.
  ALLOWED_URI_REGEXP: new RegExp(
    `^(?:(?:${[...ALLOWED_URI_SCHEMES].sort((a, b) => b.length - a.length).join('|')}):|[^a-z]|[a-z+.-]+(?:[^a-z+.\\-:]|$))`,
    'i'
  )
}

const marked = new Marked()

marked.setOptions({
  gfm: true,
  breaks: true
})

const renderer = new marked.Renderer()

// Images are never rendered. Fetching a remote image would tell the sender the reader's IP
// address and the moment they opened the chat — a tracking pixel inside a private messenger.
renderer.image = function () {
  return ''
}

// GFM task lists compile to `<input type="checkbox" disabled>`. A form control built from an
// untrusted message has no place in a chat bubble, so the state is rendered as a character.
renderer.checkbox = function ({ checked }) {
  return checked ? '\u2611 ' : '\u2610 '
}

// Raw HTML in the markdown source is shown as text rather than passed through.
// CommonMark allows inline HTML by design, which is what turned "full markdown support" into
// "arbitrary attacker-controlled HTML". Escaping it here keeps every markdown feature while
// making the message itself unable to introduce markup of its own.
renderer.html = function ({ text }) {
  return escapeHtml(text)
}

/**
 * Escapes a value for use inside an HTML text node or a double-quoted attribute.
 */
export function escapeHtml(text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

renderer.link = function ({ href, text }) {
  // Both the attribute and the label are escaped: an unescaped quote in `href` used to close
  // the inline `onClick` attribute and let the rest of the URL become a second,
  // attacker-chosen attribute such as `onmouseover`.
  const isEmail = EMAIL_PATTERN.test(href)
  const isLink = !isEmail && hasAllowedUriScheme(href)

  // Unsupported protocol: render the label as plain text, as before
  if (!isLink && !isEmail) {
    return escapeHtml(text)
  }

  const safeHref = escapeHtml(href)

  if (isEmail) {
    return `<a href="${safeHref}">${escapeHtml(text)}</a>`
  }

  // The URL itself is shown as the label, which is the pre-existing behaviour
  return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${safeHref}</a>`
}

renderer.heading = function ({ text, depth }) {
  return `<h${depth}>${text}</h${depth}>`
}

marked.use({ renderer })

/**
 * Renders markdown-formatted input to HTML, and sanitizes the result
 *
 * The output still has to be rendered through `SafeHtml`, never through `v-html`
 * @param {string} text text to render
 * @returns {string} resulting sanitized HTML
 */
export function renderMarkdown(text = '') {
  const rawHtml = marked.parse(text.replace(LINE_SEPARATOR, '\n'), { async: false }) as string

  return DOMPurify.sanitize(rawHtml, MARKDOWN_SANITIZE_CONFIG)
}

/**
 * Renders text that must be displayed verbatim, with no markup of its own
 * @param {string} text text to escape
 * @returns {string} HTML that renders as the original text
 */
export function renderPlainText(text = '') {
  return escapeHtml(text.replace(LINE_SEPARATOR, '\n'))
}

/**
 * Strips all formatting from a message and returns plain text
 *
 * The result is plain text and must be rendered as text. Passing it to an HTML sink
 * reintroduces the markup that was just removed, because reading `textContent` back out of a
 * parsed document decodes HTML entities: an incoming message containing the literal text
 * `&lt;img src=x onerror=…&gt;` comes back out of this function as a live `<img>` tag.
 *
 * Used in ChatPreview, reply previews, quoted messages and notifications
 * @param {string} text text to process
 * @returns {string} resulting clear text of the first line
 */
export function formatMessageBasic(text = '') {
  // The markdown is parsed with its line structure intact. Replacing newlines with the visual
  // symbol first collapses the message onto a single line, so the parser stops recognising
  // lists, quotes and fenced code — which is why previews used to show a half-stripped
  // `one↵ - two` and leaked the language tag out of a code fence.
  const html = renderMarkdown(text)

  // `DOMParser` neither executes scripts nor fetches sub-resources, unlike assigning to
  // `innerHTML` on an element created from the live document.
  const parsed = new DOMParser().parseFromString(html, 'text/html')

  return extractPreviewText(parsed.body)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join(LINE_BREAK_VISUAL)
}

/** Elements that end the current preview line */
const PREVIEW_BLOCK_ELEMENTS = new Set([
  'blockquote',
  'br',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'li',
  'ol',
  'p',
  'pre',
  'table',
  'tr',
  'ul'
])

/**
 * Flattens a parsed message into preview lines.
 *
 * Walking the tree rather than reading `textContent` is what keeps block structure: the text
 * of two list items becomes two lines instead of running together, and the whitespace `marked`
 * puts between tags does not turn into stray blank lines.
 *
 * The result is plain text and must stay that way — it is rendered through `PreviewText`.
 */
function extractPreviewText(root: Element): string[] {
  const lines: string[] = ['']
  const appendToCurrentLine = (value: string) => {
    lines[lines.length - 1] += value
  }
  const startNewLine = () => {
    if (lines[lines.length - 1] !== '') lines.push('')
  }

  const walk = (node: Node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        // Collapse the formatting whitespace `marked` emits between tags
        appendToCurrentLine((child.nodeValue ?? '').replace(/\s+/g, ' '))
        return
      }

      if (child.nodeType !== Node.ELEMENT_NODE) return

      const tag = (child as Element).tagName.toLowerCase()
      const isBlock = PREVIEW_BLOCK_ELEMENTS.has(tag)

      if (isBlock) startNewLine()

      // Table cells sit on one line, separated so the values stay readable
      if (tag === 'td' || tag === 'th') appendToCurrentLine(' ')

      walk(child)

      if (isBlock) startNewLine()
    })
  }

  walk(root)

  return lines
}

/**
 * Formats a message for display in a chat preview
 *
 * Returns plain text. Render it with the `PreviewText` component, which styles the
 * line-break symbol without going through an HTML sink
 * @param {string} text text to process
 * @returns {string} resulting clear text of the first line
 */
export function formatChatPreviewMessage(text = '') {
  return formatMessageBasic(text)
}
