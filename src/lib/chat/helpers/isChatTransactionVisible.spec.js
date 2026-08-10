import { describe, expect, it } from 'vitest'

import { isChatTransactionVisible } from './isChatTransactionVisible'

describe('isChatTransactionVisible', () => {
  it('hides AIP-6 signal messages and keeps user-visible transactions', () => {
    expect(isChatTransactionVisible({ asset: { chat: { type: 3 } } })).toBe(false)
    expect(isChatTransactionVisible({ asset: { chat: { type: 1 } } })).toBe(true)
    expect(isChatTransactionVisible({ type: 0 })).toBe(true)
  })
})
