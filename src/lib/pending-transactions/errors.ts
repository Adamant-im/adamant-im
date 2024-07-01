import { PendingTransaction } from './types'

export class PendingTransactionError extends Error {
  pendingTransaction: PendingTransaction
  crypto: string // e.g. 'ETH' | 'KLY'

  constructor(pendingTransaction: PendingTransaction, crypto: string) {
    super(
      `There is a pending transaction ${pendingTransaction.hash}. Please wait until it is confirmed.`
    )
    this.name = 'PendingTransactionError'
    this.pendingTransaction = pendingTransaction
    this.crypto = crypto
  }
}
