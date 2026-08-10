import { getAdamantChatMeta } from './getAdamantChatMeta'

export function isVirtualChat(partnerId) {
  return getAdamantChatMeta(partnerId)?.virtual === true
}
