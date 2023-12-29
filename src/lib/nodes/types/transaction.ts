import { TransactionStatusType } from '@/lib/constants'

export type CoinTransaction = {
  id: string
  hash: string
  fee: number
  status: TransactionStatusType
  timestamp: number
  direction: 'from' | 'to'
  /**
   * Sender coin address
   */
  senderId: string
  /**
   * Recipient coin address
   */
  recipientId: string
  /**
   * Amount of coins
   */
  amount: number
  confirmations?: number
}

export type EthTransaction = CoinTransaction & {
  blockNumber: number
  time: number // timestamp in seconds
}
