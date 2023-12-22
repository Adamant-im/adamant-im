import { getMillisTimestamp } from '@/lib/lisk/lisk-utils'
import { convertBeddowsToLSK } from '@liskhq/lisk-transactions'
import { Transaction } from './types/api/transactions/transaction'
import { NormalizedTransaction } from './types/api/transactions/normalized-transaction'

/**
 * @param transaction
 * @param ownerAddress LSK address
 */
export function normalizeTransaction(
  transaction: Transaction,
  ownerAddress: string
): NormalizedTransaction {
  const direction = transaction.sender.address === ownerAddress ? 'from' : 'to'

  return {
    id: transaction.id,
    hash: transaction.id,
    fee: Number(convertBeddowsToLSK(transaction.fee)),
    status: 'CONFIRMED',
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
