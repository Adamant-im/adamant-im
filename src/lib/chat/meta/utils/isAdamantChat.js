import { ADAMANT_CHATS_META } from '../chat-meta'

export function isAdamantChat(partnerId) {
  return Object.keys(ADAMANT_CHATS_META).some((address) => address === partnerId)
}
