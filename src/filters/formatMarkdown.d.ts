import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'

export function formatMarkdown(
  transaction: NormalizedChatMessageTransaction,
  partnerId: string,
  formatMessages: boolean
): string
