import { computed, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { TransactionAdditionalStatus, TransactionStatus } from '@/lib/constants'
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

  it('treats Dash InstantSend as a successful virtual status', () => {
    const status = useTransactionStatus(
      ref(false),
      ref('success'),
      computed(() => TransactionStatus.REGISTERED),
      undefined,
      computed(() => TransactionAdditionalStatus.INSTANT_SEND)
    )

    expect(status.value).toBe(TransactionStatus.CONFIRMED)
  })

  it('keeps Dash InstantSend as successful even if a follow-up fetch errors', () => {
    const status = useTransactionStatus(
      ref(false),
      ref('error'),
      computed(() => TransactionStatus.REGISTERED),
      undefined,
      computed(() => TransactionAdditionalStatus.INSTANT_SEND)
    )

    expect(status.value).toBe(TransactionStatus.CONFIRMED)
  })
})
