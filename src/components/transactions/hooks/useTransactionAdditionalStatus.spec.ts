import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { Cryptos, TransactionAdditionalStatus, TransactionStatus } from '@/lib/constants'
import { useTransactionAdditionalStatus } from './useTransactionAdditionalStatus'

describe('useTransactionAdditionalStatus', () => {
  it('marks Dash registered InstantSend transactions with an additional status', () => {
    const additionalStatus = useTransactionAdditionalStatus(
      ref({
        status: TransactionStatus.REGISTERED,
        instantsend: true
      }),
      Cryptos.DASH
    )

    expect(additionalStatus.value).toBe(TransactionAdditionalStatus.INSTANT_SEND)
  })

  it('marks registered ADM transactions with an additional status', () => {
    const additionalStatus = useTransactionAdditionalStatus(
      ref({
        status: TransactionStatus.REGISTERED
      }),
      Cryptos.ADM
    )

    expect(additionalStatus.value).toBe(TransactionAdditionalStatus.ADM_REGISTERED)
  })

  it('does not add a special status for regular registered DOGE transactions', () => {
    const additionalStatus = useTransactionAdditionalStatus(
      ref({
        status: TransactionStatus.REGISTERED
      }),
      Cryptos.DOGE
    )

    expect(additionalStatus.value).toBe(TransactionAdditionalStatus.NONE)
  })
})
