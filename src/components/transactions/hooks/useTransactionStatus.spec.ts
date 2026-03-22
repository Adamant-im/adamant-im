import { computed, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { TransactionStatus } from '@/lib/constants'
import { useTransactionStatus } from './useTransactionStatus'

describe('useTransactionStatus', () => {
  it('keeps optimistic pending status when a live query errors before the transaction is indexed', () => {
    const status = useTransactionStatus(
      ref(false),
      ref('error'),
      computed(() => TransactionStatus.PENDING)
    )

    expect(status.value).toBe(TransactionStatus.PENDING)
  })

  it('falls back to rejected when a live query errors and there is no known transaction state', () => {
    const status = useTransactionStatus(ref(false), ref('error'))

    expect(status.value).toBe(TransactionStatus.REJECTED)
  })
})
