import { describe, expect, it } from 'vitest'
import { TransactionStatus, tsIcon } from '@/lib/constants'

describe('transaction status icons', () => {
  it('renders REGISTERED with a different icon than CONFIRMED', () => {
    expect(tsIcon(TransactionStatus.REGISTERED)).not.toBe(tsIcon(TransactionStatus.CONFIRMED))
  })

  it('keeps pending and registered visually distinct', () => {
    expect(tsIcon(TransactionStatus.REGISTERED)).not.toBe(tsIcon(TransactionStatus.PENDING))
  })
})
