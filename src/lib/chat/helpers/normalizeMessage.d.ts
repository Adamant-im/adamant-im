import { FileData } from "@/components/UploadFile.vue";
import { DecodedChatMessageTransaction } from '@/lib/adamant-api'
import { TransactionStatusType } from '@/lib/constants'
import { ChatMessageTransaction } from '@/lib/schema/client'

export type LocalFile = {
  file: FileData
  loading: boolean
  error: string | null
}

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
  recipientPublicKey?: string
  senderPublicKey?: string
  asset: any // @todo types
  localFiles?: LocalFile[] // in case of attachments
}

export function normalizeMessage(
  transaction: ChatMessageTransaction | DecodedChatMessageTransaction
): NormalizedChatMessageTransaction
