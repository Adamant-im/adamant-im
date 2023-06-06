import { WELCOME_CHAT_ID } from '../chat-meta'

export function isWelcomeChat(partnerId) {
  return partnerId === WELCOME_CHAT_ID
}
