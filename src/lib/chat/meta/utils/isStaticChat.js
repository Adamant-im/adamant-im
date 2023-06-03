import { getAdamantChatMeta } from './getAdamantChatMeta'

export function isStaticChat(partnerId) {
  const meta = getAdamantChatMeta(partnerId)

  return meta ? meta.staticChat : false
}
