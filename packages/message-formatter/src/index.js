import { pattern as block, replace as blockReplace } from './formats/block'
import { pattern as bold, replace as boldReplace } from './formats/bold'
import { pattern as inline, replace as inlineReplace } from './formats/inline'
import { pattern as italic, replace as italicReplace } from './formats/italic'
import { pattern as strike, replace as strikeReplace } from './formats/strike'
import { pattern as link, replace as linkReplace } from './formats/link'
import { pattern as paragraph, replace as paragraphReplace } from './formats/paragraph'
import { pattern as email, replace as emailReplace } from './formats/email'

export function escapeHtml (string) {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '=': '&#x3D;'
  }

  return String(string).replace(/[&<>"'=/]/g, (s) => {
    return entityMap[s]
  })
}

export function formatMessage (message = '') {
  message = escapeHtml(message)

  return message
    .replace(block, blockReplace)
    .replace(bold, boldReplace)
    .replace(inline, inlineReplace)
    .replace(italic, italicReplace)
    .replace(strike, strikeReplace)
    .replace(link, linkReplace)
    .replace(email, emailReplace)
    .replace(paragraph, paragraphReplace)
}

export function removeFormats (message = '') {
  return String(message)
    .replace(block, '$1')
    .replace(bold, '$1')
    .replace(inline, '$1')
    .replace(italic, '$1')
    .replace(strike, '$1')
    .replace(link, '$2:$3')
    .replace(email, '$1')
    .replace(paragraph, '$1')
}
