import { isWelcomeChat } from '@/lib/chat/meta/utils'
import { renderMarkdown, sanitizeHTML } from '@/lib/markdown'
import { websiteUriToOnion } from '@/lib/uri'

export function formatMarkdown(transaction, partnerId, formatMessages, tFunction) {
  if (isWelcomeChat(partnerId) || transaction.i18n) {
    return renderMarkdown(websiteUriToOnion(tFunction(transaction.message)))
  }

  if (formatMessages) {
    return renderMarkdown(transaction.message)
  }

  return sanitizeHTML(transaction.message)
}
