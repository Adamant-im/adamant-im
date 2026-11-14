import { reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = reactive({
  chat: {
    chats: {} as Record<string, { messages: Record<string, unknown>[] }>
  }
})

vi.mock('vuex', () => ({
  useStore: () => ({ state })
}))

import { useFindAdmTransaction } from './useFindAdmTransaction'

const transfer = (id: string, senderId: string) => ({
  id,
  hash: id,
  type: 'ADM',
  senderId,
  recipientId: 'U111111'
})

describe('useFindAdmTransaction', () => {
  beforeEach(() => {
    state.chat.chats = {
      U222222: { messages: [transfer('partner-transfer', 'U222222')] },
      U333333: { messages: [transfer('other-transfer', 'U333333')] }
    }
  })

  it('finds a transaction in one of the preferred chats', () => {
    const found = useFindAdmTransaction('partner-transfer', ['U111111', 'U222222'], {
      searchAllChats: false
    })

    expect(found.value?.id).toBe('partner-transfer')
  })

  it('does not scan other chats when searchAllChats is disabled', () => {
    const found = useFindAdmTransaction('other-transfer', ['U111111', 'U222222'], {
      searchAllChats: false
    })

    expect(found.value).toBeUndefined()
  })

  it('scans every chat by default', () => {
    expect(useFindAdmTransaction('other-transfer', 'U222222').value?.id).toBe('other-transfer')
    expect(useFindAdmTransaction('other-transfer').value?.id).toBe('other-transfer')
  })
})
