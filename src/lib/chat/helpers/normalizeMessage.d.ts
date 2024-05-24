import { DecodedChatMessageTransaction } from '@/lib/adamant-api'
import { TransactionStatusType } from '@/lib/constants'

export type NormalizedChatMessageTransaction = Pick<
  DecodedChatMessageTransaction,
  'id' | 'senderId' | 'recipientId' | 'confirmations' | 'height'
> & {
  type: string // @todo use string literal
  timestamp: number
  admTimestamp: number
  status: TransactionStatusType
  i18n: boolean
  amount: number
  message: any // @todo maybe type
  hash: string
  isReply?: boolean
  isReaction?: boolean
  asset: any // @todo types
}

export function normalizeMessage(
  transaction: DecodedChatMessageTransaction
): NormalizedChatMessageTransaction
