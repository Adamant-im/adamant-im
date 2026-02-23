import { describe, expect, it } from 'vitest'
import { CHAT_ACTUALITY_BUFFER_MS } from '@/lib/constants'
import { getConnectionAwareTimeout } from '@/lib/network/connection'
import { shouldShowChatsSpinner } from './useChatsSpinner'

describe('useChatsSpinner helpers', () => {
  it('shows spinner when there are no online ADM nodes', () => {
    expect(shouldShowChatsSpinner(false, Date.now() + 10_000, Date.now())).toBe(true)
  })

  it('shows spinner when chats actuality window is expired', () => {
    const now = Date.now()
    expect(shouldShowChatsSpinner(true, now - 1, now)).toBe(true)
  })

  it('keeps spinner hidden longer when slow-connection actuality timeout is extended', () => {
    const nodeTimestamp = 1_000_000
    const pollingTimeout = 10_000
    const fastActualUntil = nodeTimestamp + pollingTimeout + CHAT_ACTUALITY_BUFFER_MS
    const slowActualUntil =
      nodeTimestamp +
      getConnectionAwareTimeout(pollingTimeout, { effectiveType: '3g' }) +
      CHAT_ACTUALITY_BUFFER_MS
    const currentTime = fastActualUntil + 1_000

    expect(shouldShowChatsSpinner(true, fastActualUntil, currentTime)).toBe(true)
    expect(shouldShowChatsSpinner(true, slowActualUntil, currentTime)).toBe(false)
  })
})
