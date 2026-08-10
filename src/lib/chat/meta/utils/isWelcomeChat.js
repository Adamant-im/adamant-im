import { WELCOME_CHAT_ID } from '../chat-meta.js'

export function isWelcomeChat(partnerId) {
  return partnerId === WELCOME_CHAT_ID
}
