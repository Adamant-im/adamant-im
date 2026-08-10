import { describe, expect, it, vi } from 'vitest'

import { actions } from './bot-commands-actions'
import type { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'

describe('bot command actions', () => {
  it('groups interleaved commands by recipient without Object.groupBy', () => {
    const commit = vi.fn()
    const messages = [
      { recipientId: 'U1', message: '/help', timestamp: 1 },
      { recipientId: 'U2', message: '/rates', timestamp: 2 },
      { recipientId: 'U1', message: 'plain text', timestamp: 3 },
      { recipientId: 'U1', message: '/balance', timestamp: 4 }
    ] as NormalizedChatMessageTransaction[]

    const reInitCommands = actions.reInitCommands
    expect(typeof reInitCommands).toBe('function')
    if (typeof reInitCommands !== 'function') throw new Error('Expected a Vuex action handler')

    Reflect.apply(reInitCommands, undefined, [{ commit } as never, messages])

    expect(commit).toHaveBeenNthCalledWith(1, 'initCommands', {
      partnerId: 'U1',
      commands: [
        { command: '/help', timestamp: 1 },
        { command: '/balance', timestamp: 4 }
      ]
    })
    expect(commit).toHaveBeenNthCalledWith(2, 'initCommands', {
      partnerId: 'U2',
      commands: [{ command: '/rates', timestamp: 2 }]
    })
  })
})
