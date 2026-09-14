import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/reset-state', () => ({
  resetState: vi.fn()
}))

import mutations from './adm-mutations'

describe('ADM transaction mutations', () => {
  it('requires at least one confirmation before marking a transaction confirmed', () => {
    const state = {
      address: 'U111111',
      transactions: {},
      transactionsCount: 0,
      minHeight: Infinity,
      maxHeight: -1
    }

    mutations.transactions(state, [
      {
        id: 'registered-transfer',
        senderId: 'U222222',
        recipientId: 'U111111',
        amount: 10_000_000,
        height: 100,
        confirmations: 0,
        status: 'CONFIRMED'
      },
      {
        id: 'confirmed-transfer',
        senderId: 'U222222',
        recipientId: 'U111111',
        amount: 10_000_000,
        height: 100,
        confirmations: 1
      }
    ])

    expect(state.transactions['registered-transfer'].status).toBe('REGISTERED')
    expect(state.transactions['confirmed-transfer'].status).toBe('CONFIRMED')
  })
})
