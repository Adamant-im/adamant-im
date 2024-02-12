import { StoreTransaction } from '@/store/types/transaction'

/**
 * Sort transactions by timestamp, from newest to oldest.
 * Pending transactions are placed at the top.
 *
 * Marker of a pending transaction is a missing `timestamp`.
 * @param left
 * @param right
 */
export function sortTransactionsFn(left?: StoreTransaction, right?: StoreTransaction) {
  if (!left || !right) {
    return 0
  }

  if (!left.timestamp) {
    return -1
  }
  if (!right.timestamp) return 1

  return right.timestamp - left.timestamp
}
