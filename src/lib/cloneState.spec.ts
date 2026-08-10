import { reactive } from 'vue'
import { describe, expect, it } from 'vitest'

import { cloneState } from './cloneState'

describe('cloneState', () => {
  it('clones reactive nested state without retaining references', () => {
    const original = reactive({
      chats: [{ id: 'U1', messages: [{ id: 1 }] }],
      updatedAt: new Date('2026-08-10T00:00:00Z')
    })

    const cloned = cloneState(original)

    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(cloned.chats).not.toBe(original.chats)
    expect(cloned.chats[0].messages).not.toBe(original.chats[0].messages)
    expect(cloned.updatedAt).toBeInstanceOf(Date)

    cloned.chats[0].messages.push({ id: 2 })
    expect(original.chats[0].messages).toHaveLength(1)
  })

  it('rejects values that cannot be persisted as structured data', () => {
    expect(() => cloneState({ callback: () => undefined })).toThrow()
  })
})
