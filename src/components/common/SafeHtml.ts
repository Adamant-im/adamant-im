import { defineComponent, h, type PropType, type VNode, type VNodeArrayChildren } from 'vue'

import { hasAllowedUriScheme } from '@/lib/uriSchemes'

/**
 * Renders a limited subset of HTML as a Vue VNode tree.
 *
 * This component exists to replace `v-html` everywhere in the application.
 *
 * `v-html` assigns a string to `innerHTML`, which makes the sink itself capable of
 * creating any element and any attribute, including event handlers. The only thing
 * standing between an attacker and code execution is whichever sanitizer ran earlier,
 * so a single sanitizer bypass (see the DOMPurify advisories) is a complete XSS.
 *
 * Here the HTML string is parsed with `DOMParser` — which never executes scripts and
 * never loads sub-resources — and the resulting tree is rebuilt with `h()` using an
 * explicit tag and attribute allowlist. Element names and attribute names that are not
 * on the allowlist are never passed to `h()`, so this sink is structurally unable to
 * produce an event handler, a `<script>`, or a `<style>`, no matter what the input is
 * or what an upstream sanitizer missed.
 *
 * Profiles:
 *
 * - `message` (default) — for untrusted content coming from the network (chat messages).
 *   `class` is not allowed: the application ships utility classes (Vuetify's
 *   `position-fixed`, `w-100`, `h-100`, `bg-*`) that would let a message paint a
 *   full-viewport overlay over the app UI.
 * - `ui` — for bundled i18n strings that legitimately carry markup and styling hooks.
 *   Allows `class`. Any dynamic value interpolated into such a string must still be
 *   escaped by the caller with `escapeHtml()`.
 */

const ALLOWED_TAGS = new Set([
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
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul'
])

/** Elements whose text content must not leak into the output either */
const DROPPED_TAGS = new Set([
  // `img` is absent from the allowlist on purpose and dropped outright: the messenger never
  // fetches a remote resource, which would leak the reader's IP to whoever sent the message.
  'img',
  // A chat message must not be able to render a form control
  'input',
  'button',
  'select',
  'textarea',
  'form',
  'script',
  'style',
  'template',
  'iframe',
  'object',
  'embed',
  'noscript',
  'link',
  'meta',
  'base',
  'title'
])

/** Void elements: `h()` must not receive children for these */
const VOID_TAGS = new Set(['br', 'hr'])

/** Wrapper added around tables so they can scroll horizontally inside a chat bubble */
const TABLE_SCROLL_CLASS = 'a-chat__message-table'

/**
 * Relative links are safe: they cannot introduce a new scheme.
 *
 * This also admits protocol-relative URLs (`//evil.com`), which do lead off-site. That is
 * deliberate — the risk is the same as the plain `https:` links already on the allowlist, and
 * `SafeHtml` forces `rel="noopener noreferrer"` on every anchor regardless.
 */
const RELATIVE_URI = /^(?:[/#?]|$)/

function isSafeHref(href: string): boolean {
  // The scheme allowlist is shared with the markdown renderer and with `openExternalLink`,
  // so the three cannot drift apart. See `lib/uriSchemes.ts`.
  return hasAllowedUriScheme(href) || RELATIVE_URI.test(href.trim())
}

type Profile = 'message' | 'ui'

function buildProps(element: Element, profile: Profile): Record<string, string> | null {
  const props: Record<string, string> = {}
  const tag = element.tagName.toLowerCase()

  if (profile === 'ui') {
    const className = element.getAttribute('class')
    if (className) props.class = className
  }

  if (tag !== 'a') return props

  const href = element.getAttribute('href')

  if (href !== null) {
    // An anchor with an unusable target is rendered as plain text instead, so the user
    // never sees something that looks like a link but silently does nothing.
    if (!isSafeHref(href)) return null

    props.href = href
    props.target = '_blank'
    props.rel = 'noopener noreferrer'
  }

  return props
}

function toVNodes(nodes: NodeListOf<ChildNode>, profile: Profile): VNodeArrayChildren {
  const children: VNodeArrayChildren = []

  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      children.push(node.nodeValue ?? '')
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    const element = node as Element
    const tag = element.tagName.toLowerCase()

    if (DROPPED_TAGS.has(tag)) return

    if (!ALLOWED_TAGS.has(tag)) {
      // Unknown wrapper: keep the readable content, drop the element itself
      children.push(...toVNodes(element.childNodes, profile))
      return
    }

    const props = buildProps(element, profile)

    if (props === null) {
      children.push(...toVNodes(element.childNodes, profile))
      return
    }

    if (VOID_TAGS.has(tag)) {
      children.push(h(tag, props))
      return
    }

    const rendered = h(tag, props, toVNodes(element.childNodes, profile))

    if (tag === 'table') {
      // A table needs a separate scroll container. Inside a chat bubble, which sizes to its
      // content, `overflow-x` on the table itself makes the table shrink to the available
      // width instead of overflowing it, so the columns collapse rather than scroll.
      // The class is added here, by us — it never comes from the message.
      children.push(h('div', { class: TABLE_SCROLL_CLASS }, [rendered]))
      return
    }

    children.push(rendered)
  })

  return children
}

export function renderSafeHtml(html: string, profile: Profile = 'message'): VNodeArrayChildren {
  if (!html) return []

  const parsed = new DOMParser().parseFromString(html, 'text/html')

  return toVNodes(parsed.body.childNodes, profile)
}

export default defineComponent({
  name: 'SafeHtml',
  props: {
    /** HTML string to render. Only allowlisted tags and attributes survive */
    html: {
      type: String,
      default: ''
    },
    /** Wrapper element to render the content into */
    tag: {
      type: String,
      default: 'div'
    },
    /** `message` for network content, `ui` for bundled i18n strings */
    profile: {
      type: String as PropType<Profile>,
      default: 'message'
    }
  },
  setup(props) {
    return (): VNode => h(props.tag, renderSafeHtml(props.html, props.profile))
  }
})
