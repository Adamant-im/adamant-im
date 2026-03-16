import { describe, expect, it } from 'vitest'
import { shouldDisplayChat } from './chatVisibility'

describe('shouldDisplayChat', () => {
  it('returns true for regular user chats', () => {
    expect(
      shouldDisplayChat({
        isAdamantChat: false,
        isStaticChat: false,
        messagesCount: 0
      })
    ).toBe(true)
  })

  it('returns true for static chats', () => {
    expect(
      shouldDisplayChat({
        isAdamantChat: true,
        isStaticChat: true,
        messagesCount: 0
      })
    ).toBe(true)
  })

  it('returns true for ADAMANT chats with message history', () => {
    expect(
      shouldDisplayChat({
        isAdamantChat: true,
        isStaticChat: false,
        messagesCount: 2
      })
    ).toBe(true)
  })

  it('returns false for ADAMANT chats without enough history', () => {
    expect(
      shouldDisplayChat({
        isAdamantChat: true,
        isStaticChat: false,
        messagesCount: 1
      })
    ).toBe(false)
  })
})
