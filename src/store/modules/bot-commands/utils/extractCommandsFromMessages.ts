import { getRealTimestamp } from '@/lib/chat/helpers/utils/getRealTimestamp'
import { BotCommand } from '@/store/modules/bot-commands/types.ts'

export function extractCommandsFromMessages(
  recipientId: string,
  messages: { message: any; timestamp: number; recipientId: string }[]
): BotCommand[] {
  return messages
    .filter((item) => item.recipientId === recipientId)
    .filter((item) => typeof item.message === 'string')
    .filter((item) => item.message?.startsWith('/'))
    .map((item) => ({
      command: item.message.trim(),
      timestamp: getRealTimestamp(item.timestamp)
    }))
}
