import { describe, expect, it } from 'vitest'

import { isIncomingMessage } from './isIncomingMessage'

describe('isIncomingMessage', () => {
  it('returns false for outgoing messages, including self-chat messages', () => {
    expect(isIncomingMessage('U123456789', 'U123456789')).toBe(false)
    expect(isIncomingMessage('u123456789', 'U123456789')).toBe(false)
  })

  it('returns true for messages from another sender', () => {
    expect(isIncomingMessage('U987654321', 'U123456789')).toBe(true)
  })
})
