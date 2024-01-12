import { PendingTransaction } from './types'

export class PendingTransactionError extends Error {
  constructor(pendingTransaction: PendingTransaction) {
    super(
      `There is a pending transaction ${pendingTransaction.hash}. Please wait until it is confirmed.`
    )
    this.name = 'PendingTransactionError'
  }
}
