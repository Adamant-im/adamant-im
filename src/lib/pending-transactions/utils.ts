import { PendingTransaction } from './types'

type CreatePendingTransactionParams = {
  hash: string
  senderId: string
  recipientId: string
  amount: number
  fee: number | string
  timestamp: number
  nonce: number
}

export function createPendingTransaction(
  params: CreatePendingTransactionParams
): PendingTransaction {
  const { hash, senderId, recipientId, amount, fee, timestamp, nonce } = params

  return {
    id: hash,
    hash,
    senderId,
    recipientId,
    amount,
    fee: Number(fee),
    status: 'PENDING',
    timestamp,
    direction: 'from',
    nonce
  }
}
