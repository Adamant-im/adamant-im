import { ADAMANT_CHATS_META } from '@/lib/chat/meta/chat-meta'
import { EPOCH, TransactionStatus } from '@/lib/constants'

export function generateAdamantChats() {
  return Object.entries(ADAMANT_CHATS_META)
    .filter(([, chatMeta]) => !!chatMeta.welcomeMessage)
    .reduce((acc, [senderId, chatMeta]) => {
      return {
        ...acc,
        [senderId]: {
          messages: [
            {
              id: chatMeta.welcomeMessage, // must be uniq id
              message: chatMeta.welcomeMessage,
              timestamp: EPOCH,
              senderId,
              type: 'message',
              i18n: true,
              status: TransactionStatus.CONFIRMED,
              readonly: true
            }
          ],
          numOfNewMessages: 0,
          readOnly: true,
          offset: 0,
          page: 0
        }
      }
    }, {})
}
