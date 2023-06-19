import { ADAMANT_CHATS_META } from '@/lib/chat/meta/chat-meta'

export function createPartnersListState() {
  return Object.entries(ADAMANT_CHATS_META)
    .filter(([, meta]) => meta.staticChat)
    .reduce((acc, [partnerId, meta]) => {
      return {
        ...acc,
        [partnerId]: meta
      }
    }, {})
}
