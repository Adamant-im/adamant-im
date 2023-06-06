import { ADAMANT_CHATS_META } from '../chat-meta'

export function getAdamantChatMeta(partnerId) {
  return ADAMANT_CHATS_META[partnerId] || null
}
