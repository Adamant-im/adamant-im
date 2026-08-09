import { isWelcomeChat } from '@/lib/chat/meta/utils'
import { renderMarkdown, renderPlainText } from '@/lib/markdown'
import { websiteUriToOnion } from '@/lib/uri'

/**
 * Returns sanitized HTML for a chat message.
 *
 * The result must be rendered through the `SafeHtml` component, never through `v-html`.
 * @returns {string}
 */
export function formatMarkdown(transaction, partnerId, formatMessages, tFunction) {
  if (isWelcomeChat(partnerId) || transaction.i18n) {
    return renderMarkdown(websiteUriToOnion(tFunction(transaction.message)))
  }

  if (formatMessages) {
    return renderMarkdown(transaction.message)
  }

  // Formatting is disabled: the message must be shown exactly as it was written, so it is
  // escaped rather than sanitized. Sanitizing here used to leave the message free to bring
  // its own markup — a working `<form>` or a full-viewport styled block inside the chat.
  return renderPlainText(transaction.message)
}
