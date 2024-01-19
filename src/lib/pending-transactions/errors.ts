import { PendingTransaction } from './types'

export class PendingTransactionError extends Error {
  pendingTransaction: PendingTransaction
  crypto: 'ETH' | 'LSK'

  constructor(pendingTransaction: PendingTransaction, crypto: 'ETH' | 'LSK') {
    super(
      `There is a pending transaction ${pendingTransaction.hash}. Please wait until it is confirmed.`
    )
    this.name = 'PendingTransactionError'
    this.pendingTransaction = pendingTransaction
    this.crypto = crypto
  }
}
