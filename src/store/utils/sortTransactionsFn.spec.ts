import { describe, it, expect } from 'vitest'

import { sortTransactionsFn } from './sortTransactionsFn'
import type { StoreTransaction } from '@/store/types/transaction'

describe('sortTransactionsFn', () => {
  it('should sort transactions by timestamp in descending order', () => {
    const transactions: StoreTransaction[] = [{ timestamp: 3 }, { timestamp: 1 }, { timestamp: 2 }]

    transactions.sort(sortTransactionsFn)

    expect(transactions[0].timestamp).toBe(3)
    expect(transactions[1].timestamp).toBe(2)
    expect(transactions[2].timestamp).toBe(1)
  })

  it('should place transactions without a timestamp at the beginning', () => {
    const transactions: StoreTransaction[] = [
      { timestamp: 3 },
      { timestamp: undefined },
      { timestamp: 2 }
    ]

    transactions.sort(sortTransactionsFn)

    expect(transactions[0].timestamp).toBeUndefined()
    expect(transactions[1].timestamp).toBe(3)
    expect(transactions[2].timestamp).toBe(2)
  })

  it('should return 0 when both transactions are not defined', () => {
    const result = sortTransactionsFn(undefined, undefined)

    expect(result).toBe(0)
  })
})
