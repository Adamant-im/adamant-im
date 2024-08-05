import { TransactionStatusType } from '@/lib/constants'

export type CoinTransaction = {
  /**
   * Transaction id, same as `hash`
   */
  id: string
  /**
   * Transaction hash
   */
  hash: string
  /**
   * Transaction fee.
   * Already divided by coin DECIMALS.
   */
  fee: number
  status: TransactionStatusType
  /**
   * The time when transaction was included in block (in ms)
   * If `undefined` when transaction is not included in block yet,
   * so it should in PENDING/REGISTERED status.
   */
  timestamp?: number
  /**
   * Direction of the transaction:
   * - 'from' - incoming transaction
   * - 'to' - outgoing transaction
   */
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
  /**
   * The difference between the current block height
   * and the block height in which the transaction was included.
   */
  confirmations?: number
}

export type KlyTransaction = CoinTransaction & {
  data: string
  height?: number
  nonce: string
  module: 'token'
  command: 'transfer'
}

export type EthTransaction = Omit<CoinTransaction, 'timestamp'> & {
  blockNumber?: number
  time?: number // timestamp in seconds
  timestamp?: number // timestamp in milliseconds
}

export type Erc20Transaction = EthTransaction & {
  gasPrice: number
}

export type BtcTransaction = Omit<CoinTransaction, 'confirmations'> & {
  time: number // in seconds
  confirmations: number
  senders: string[]
  recipients: string[]
  height: number
}

export type DogeTransaction = Omit<BtcTransaction, 'height'>
export type DashTransaction = BtcTransaction

export type AnyCoinTransaction =
  | BtcTransaction
  | DogeTransaction
  | DashTransaction
  | EthTransaction
  | KlyTransaction
