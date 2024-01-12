import { getMillisTimestamp } from '@/lib/lisk/lisk-utils'
import { convertBeddowsToLSK } from '@liskhq/lisk-transactions'
import { TransactionStatus, TransactionStatusType } from '@/lib/constants'
import { Transaction } from './types/api/transactions/transaction'
import { LskTransaction } from '@/lib/nodes/types/transaction'

/**
 * @param transaction
 * @param ownerAddress LSK address
 */
export function normalizeTransaction(
  transaction: Transaction,
  ownerAddress: string
): LskTransaction {
  const direction = transaction.sender.address === ownerAddress ? 'from' : 'to'

  return {
    id: transaction.id,
    hash: transaction.id,
    fee: Number(convertBeddowsToLSK(transaction.fee)),
    status: mapStatus(transaction.executionStatus),
    data: transaction.params.data,
    timestamp: getMillisTimestamp(transaction.block.timestamp), // block timestamp
    direction,
    senderId: transaction.sender.address,
    recipientId: transaction.params.recipientAddress,
    amount: Number(convertBeddowsToLSK(transaction.params.amount)),
    height: transaction.block.height,
    nonce: transaction.nonce,
    module: 'token',
    command: 'transfer'
  }
}

/**
 * Map LSK transaction execution status to our internal status
 * @param status
 */
function mapStatus(status: Transaction['executionStatus']): TransactionStatusType {
  switch (status) {
    case 'successful':
      return TransactionStatus.CONFIRMED
    case 'pending':
      return TransactionStatus.PENDING
    case 'failed':
      return TransactionStatus.REJECTED
    default:
      throw new Error(`LskIndexer: Unknown status: ${status}`)
  }
}
