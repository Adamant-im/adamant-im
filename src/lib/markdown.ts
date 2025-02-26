import { Marked } from 'marked'
import DOMPurify from 'dompurify'

interface IImageParams {
  href: string
  title: string
  text: string
}

interface ILinkParams {
  href: string
  title: string
  tokens: string
}

// The U+2028 character (LINE SEPARATOR) is sometimes used as a line break, but it is treated as a space in some web environments,
// causing unexpected rendering issues. To avoid this, it's recommended to replace it with a standard line break character such as `\n`.
const LINE_SEPARATOR: RegExp = /\u2028/g

// LINE_BREAK_VISUAL is used for formatting when the message is displayed as a single line in a preview.
// It replaces line breaks with a visual symbol (↵) to indicate where new lines exist in the original text.
const LINE_BREAK_VISUAL: string = '↵ '

const markedInstance = new Marked()

markedInstance.setOptions({
  // marked sanitize is deprecated, using DOMPurify
  // sanitize: true,
  gfm: true,
  breaks: true
})

const renderer = new markedInstance.Renderer()

renderer.image = function ({ _href, _title, _text }: IImageParams): string {
  return ''
}

renderer.link = function ({ href, _title, text }: ILinkParams): string {
  const linkPattern = /^(eth|bch|bitcoin|https?|s?ftp|magnet|tor|onion|tg):(.*)$/i
  const emailPattern = /^(mailto):[^@]+@[^@]+\.[^@]+$/i

  if (linkPattern.test(href)) {
    return `<a onClick="window.open('${href}', '_blank', 'resizable,scrollbars,status,noopener'); return false;">${href}</a>`
  } else if (emailPattern.test(href)) {
    return `<a href="${href}">${text}</a>`
  }

  return text
}

renderer.heading = function ({ text }): string {
  return `<p>${text}</p>`
}

markedInstance.use({ renderer })

/**
 * Sanitizes text to show HTML
 * @param {string} text text to sanitize
 * @returns {string} sanitized HTML
 */
export function sanitizeHTML(text: string = ''): string {
  return DOMPurify.sanitize(text)
}

/**
 * Renders markdown-formatted input to HTML, and sanitizes it
 * @param {string} text text to render
 * @returns {string} resulting sanitized HTML
 */
export function renderMarkdown(text: string = ''): string | Promise<string> {
  return markedInstance.parse(sanitizeHTML(text.replace(LINE_SEPARATOR, '\n')))
}

/**
 * Gets the first line of a message, sanitizes it, and returns back
 * Used in ChatPreview and Notifications
 * @param {string} text text to process
 * @returns {string} resulting clear text of the first line
 */
export function removeFormats(text: string = ''): string | null | Promise<string> {
  const node = document.createElement('div')
  const textWithSymbol = text.replace(/\n/g, '↵ ')
  node.innerHTML = markedInstance.parse(sanitizeHTML(textWithSymbol))

  return node.textContent || node.innerText || ''
}

export function formatMessage(text: string = ''): string | Promise<string> {
  const node = document.createElement('div')

  const textWithSymbol = text.replace(/\n/g, LINE_BREAK_VISUAL)
  node.innerHTML = markedInstance.parse(sanitizeHTML(textWithSymbol))

  const textWithoutHtml = node.textContent || node.innerText || ''

  return textWithoutHtml
    .replace(LINE_SEPARATOR, LINE_BREAK_VISUAL)
    .replace(/↵/g, '<span class="arrow-return">↵</span>')
}
