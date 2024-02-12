import { PendingTransaction } from './types'

type CreatePendingTransactionParams = {
  hash: string
  senderId: string
  recipientId: string
  amount: number
  fee: number | string
  nonce?: number
}

export function createPendingTransaction(
  params: CreatePendingTransactionParams
): PendingTransaction {
  const { hash, senderId, recipientId, amount, fee, nonce } = params

  return {
    id: hash,
    hash,
    senderId,
    recipientId,
    amount,
    fee: Number(fee),
    status: 'PENDING',
    direction: 'from',
    nonce,
    timestamp: Date.now()
  }
}
