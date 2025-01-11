import { getMillisTimestamp } from '@/lib/klayr/klayr-utils'
import { convertBeddowsTokly } from '@klayr/transactions'
import { TransactionStatus, TransactionStatusType } from '@/lib/constants'
import { Transaction } from './types/api/transactions/transaction'
import { KlyTransaction } from '@/lib/nodes/types/transaction'

/**
 * @param transaction
 * @param ownerAddress KLY address
 */
export function normalizeTransaction(
  transaction: Transaction,
  ownerAddress: string
): KlyTransaction {
  const direction = transaction.sender.address === ownerAddress ? 'from' : 'to'
  const isFinalized =
    transaction.executionStatus === 'successful' || transaction.executionStatus === 'failed'

  return {
    id: transaction.id,
    hash: transaction.id,
    fee: Number(convertBeddowsTokly(transaction.fee)),
    status: mapStatus(transaction.executionStatus),
    data: transaction.params.data,
    timestamp: isFinalized ? getMillisTimestamp(transaction.block.timestamp) : undefined, // block timestamp
    direction,
    senderId: transaction.sender.address,
    recipientId: transaction.params.recipientAddress,
    amount: Number(convertBeddowsTokly(transaction.params.amount)),
    height: isFinalized ? transaction.block.height : undefined,
    nonce: transaction.nonce,
    module: 'token',
    command: 'transfer'
  }
}

/**
 * Map KLY transaction execution status to our internal status
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
      throw new Error(`KlyIndexer: Unknown status: ${status}`)
  }
}
