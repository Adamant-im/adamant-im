import { computed, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { TransactionAdditionalStatus, TransactionStatus } from '@/lib/constants'
import { AllNodesOfflineError } from '@/lib/nodes/utils/errors'
import { useTransactionStatus } from './useTransactionStatus'

describe('useTransactionStatus', () => {
  it('rejects a pending status when a background refetch exhausts all retries', () => {
    const status = useTransactionStatus(
      ref(false),
      ref('error'),
      computed(() => TransactionStatus.PENDING),
      undefined,
      undefined,
      ref(false),
      ref(true)
    )

    expect(status.value).toBe(TransactionStatus.REJECTED)
  })

  it('keeps a registered status when a background refetch errors after the node has seen the transaction', () => {
    const status = useTransactionStatus(
      ref(false),
      ref('error'),
      computed(() => TransactionStatus.REGISTERED),
      undefined,
      undefined,
      ref(false),
      ref(true)
    )

    expect(status.value).toBe(TransactionStatus.REGISTERED)
  })

  it('falls back to rejected when a live query errors and there is no known transaction state', () => {
    const status = useTransactionStatus(
      ref(false),
      ref('error'),
      undefined,
      undefined,
      undefined,
      ref(true),
      ref(false)
    )

    expect(status.value).toBe(TransactionStatus.REJECTED)
  })

  it('keeps pending while the query error is recoverable and the network can come back later', () => {
    const status = useTransactionStatus(
      ref(false),
      ref('error'),
      undefined,
      undefined,
      undefined,
      ref(true),
      ref(false),
      ref(new AllNodesOfflineError('btc'))
    )

    expect(status.value).toBe(TransactionStatus.PENDING)
  })

  it('rejects a pending transaction when the initial lookup exhausts all retries', () => {
    const status = useTransactionStatus(
      ref(false),
      ref('error'),
      computed(() => TransactionStatus.PENDING),
      undefined,
      undefined,
      ref(true),
      ref(false)
    )

    expect(status.value).toBe(TransactionStatus.REJECTED)
  })

  it('rejects a pending known status on a definitive query error even without loading flags', () => {
    const status = useTransactionStatus(
      ref(false),
      ref('error'),
      computed(() => TransactionStatus.PENDING),
      undefined,
      undefined,
      ref(false),
      ref(false)
    )

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
      computed(() => TransactionAdditionalStatus.INSTANT_SEND),
      ref(false),
      ref(true)
    )

    expect(status.value).toBe(TransactionStatus.CONFIRMED)
  })
})
