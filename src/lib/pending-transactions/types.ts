import { CoinTransaction } from '@/lib/nodes/types/transaction'

export type PendingTransaction = Pick<
  CoinTransaction,
  | 'id'
  | 'hash'
  | 'senderId'
  | 'recipientId'
  | 'amount'
  | 'fee'
  | 'status'
  | 'timestamp'
  | 'direction'
> & {
  nonce: number
}
