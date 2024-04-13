import { BotCommand } from '@/store/modules/bot-commands/types'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'

/**
 * The function retrieves all bot commands from the message array
 * @param recipientId  Message recipient address
 * @param messages Array of normalized messages
 * @return Bot commands array
 * */
export function extractCommandsFromMessages(
  recipientId: string,
  messages: NormalizedChatMessageTransaction[]
): BotCommand[] {
  return messages
    .filter(
      (item) =>
        item.recipientId === recipientId &&
        typeof item.message === 'string' &&
        item.message?.startsWith('/')
    )
    .map((item) => ({
      command: item.message.trim(),
      timestamp: item.timestamp
    }))
}
