import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({
  // marked sanitize is deprecated, using DOMPurify
  // sanitize: true,
  gfm: true,
  breaks: true
})

const renderer = new marked.Renderer()

renderer.image = function (_href, _title, _text) {
  return ''
}

renderer.link = function (href, title, text) {
  const linkPattern = /^(eth|bch|bitcoin|https?|s?ftp|magnet|tor|onion|tg):(.*)$/i
  const emailPattern = /^(mailto):[^@]+@[^@]+\.[^@]+$/i

  if (linkPattern.test(href)) {
    return `<a onClick="window.open('${href}', '_blank', 'resizable,scrollbars,status,noopener'); return false;">${href}</a>`
  } else if (emailPattern.test(href)) {
    return `<a href="${href}">${text}</a>`
  }

  return text
}

renderer.heading = function (text) {
  return `<p>${text}</p>`
}

/**
 * Sanitizes text to show HTML
 * @param {string} text text to sanitize
 * @returns {string} sanitized HTML
 */
export function sanitizeHTML(text = '') {
  return DOMPurify.sanitize(text)
}

/**
 * Renders markdown-formatted input to HTML, and sanitizes it
 * @param {string} text text to render
 * @returns {string} resulting sanitized HTML
 */
export function renderMarkdown(text = '') {
  return marked(DOMPurify.sanitize(text), { renderer })
}

/**
 * Gets the first line of a message, sanitizes it, and returns back
 * Used in ChatPreview and Notifications
 * @param {string} text text to process
 * @returns {string} resulting clear text of the first line
 */
export function removeFormats(text = '') {
  const node = document.createElement('div')
  const textWithSumbol = text.replace(/\n/g, '↵ ')
  node.innerHTML = marked(DOMPurify.sanitize(textWithSumbol), { renderer })

  return node.textContent || node.innerText || ''
}

export function formatMessage(text = '') {
  const node = document.createElement('div')
  const textWithSumbol = text.replace(/\n/g, '↵ ')
  node.innerHTML = marked(DOMPurify.sanitize(textWithSumbol), { renderer })

  const textWithoutHtml = node.textContent || node.innerText || ''
  const styledText = textWithoutHtml.replace(
    /↵/g,
    '<span style="color:rgba(255, 255, 255, 0.5)">↵</span>'
  )
  return styledText
}
