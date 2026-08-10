import { describe, expect, it } from 'vitest'
import { isAdamantChat, isVirtualChat } from '@/lib/chat/meta/utils'

describe('isAdamantChat', () => {
  it('should return `true` when it is Bounty Wallet', () => {
    expect(isAdamantChat('U15423595369615486571')).toBe(true)
  })

  it('should return `true` when is Exchange Bot', () => {
    expect(isAdamantChat('U5149447931090026688')).toBe(true)
  })

  it('should return `true` when is ADAMANT Welcome chat', () => {
    expect(isAdamantChat('chats.virtual.welcome_message_title')).toBe(true)
  })

  it('should return `false` when is not an ADAMANT chat', () => {
    expect(isAdamantChat('U123456')).toBe(false)
  })
})

describe('isVirtualChat', () => {
  it('returns true only for client-side chats without node history', () => {
    expect(isVirtualChat('chats.virtual.welcome_message_title')).toBe(true)
    expect(isVirtualChat('U15423595369615486571')).toBe(false)
    expect(isVirtualChat('U123456')).toBe(false)
  })
})
