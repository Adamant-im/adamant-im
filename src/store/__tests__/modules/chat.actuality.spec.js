import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import chatModule from '@/store/modules/chat'
import adamant from '@/lib/adamant'
import { CHAT_ACTUALITY_BUFFER_MS } from '@/lib/constants'
import { getChats } from '@/lib/chat/helpers'

vi.mock('@/store', () => {
  return {
    default: {},
    store: {}
  }
})

vi.mock('@/lib/idb/crypto', () => ({
  encryptPassword: () => {}
}))

vi.mock('@/lib/idb/state', () => ({
  restoreState: () => {}
}))

vi.mock('@/lib/adamant-api', () => ({
  getPublicKey: vi.fn()
}))

vi.mock('@/lib/chat/helpers', () => ({
  createChat: vi.fn(),
  getChats: vi.fn(),
  queueMessage: vi.fn(),
  createMessage: vi.fn(),
  createTransaction: vi.fn(),
  createReaction: vi.fn(),
  normalizeMessage: vi.fn((message) => message),
  createAttachment: vi.fn(),
  queueSignedMessage: vi.fn()
}))

const originalNavigatorConnectionDescriptor = Object.getOwnPropertyDescriptor(
  globalThis.navigator,
  'connection'
)

const { getters, actions } = chatModule

describe('Store: chat actuality on slow connection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (originalNavigatorConnectionDescriptor) {
      Object.defineProperty(
        globalThis.navigator,
        'connection',
        originalNavigatorConnectionDescriptor
      )
    } else {
      Reflect.deleteProperty(globalThis.navigator, 'connection')
    }
  })

  it('increases chats actuality timeout by x1.5 on potentially slow connection', () => {
    Object.defineProperty(globalThis.navigator, 'connection', {
      configurable: true,
      value: {
        effectiveType: '3g'
      }
    })

    expect(getters.chatsActualityTimeout({}, { chatsPollingTimeout: 10_000 })).toBe(15_000)
  })

  it('keeps chats actuality timeout unchanged on regular connection', () => {
    Object.defineProperty(globalThis.navigator, 'connection', {
      configurable: true,
      value: {
        effectiveType: '4g',
        rtt: 100,
        downlink: 10
      }
    })

    expect(getters.chatsActualityTimeout({}, { chatsPollingTimeout: 10_000 })).toBe(10_000)
  })

  it('writes extended chatsActualUntil when slow-connection timeout is provided', async () => {
    const nodeTimestamp = 1234
    vi.mocked(getChats).mockResolvedValue({
      messages: [],
      lastMessageHeight: 0,
      nodeTimestamp
    })

    const state = {
      isFulfilled: true,
      lastMessageHeight: 100
    }
    const commit = vi.fn()
    const dispatch = vi.fn()
    const moduleGetters = {
      chatsActualityTimeout: 15_000
    }

    await actions.getNewMessages({ state, getters: moduleGetters, commit, dispatch })

    expect(dispatch).toHaveBeenCalledWith('pushMessages', [])
    expect(commit).toHaveBeenCalledWith(
      'setChatsActualUntil',
      adamant.toTimestamp(nodeTimestamp) +
        moduleGetters.chatsActualityTimeout +
        CHAT_ACTUALITY_BUFFER_MS
    )
  })
})
