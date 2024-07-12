import { TransactionStatusType } from '@/lib/constants'

export type StoreTransaction = {
  id?: string
  hash?: string
  isNew?: true
  direction?: 'from' | 'to'
  force?: true
  senderId?: string
  recipientId?: string
  amount?: number | string
  fee?: number | string
  status?: TransactionStatusType
  timestamp?: number
  /**
   * ETH specific
   */
  gasPrice?: number | string
  /**
   * KLY specific
   */
  data?: string
}
