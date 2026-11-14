import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'

vi.mock('@/lib/idb/state', () => ({
  restoreState: vi.fn(() => Promise.resolve()),
  saveState: vi.fn(() => Promise.resolve())
}))
vi.mock('@/lib/idb/crypto', () => ({ encryptPassword: vi.fn(), decryptPassword: vi.fn() }))
vi.mock('@/lib/nodes/ipfs/index', () => ({ ipfs: {} }))
vi.mock('@/lib/adamant-api', () => ({
  adm: {},
  getPublicKey: vi.fn(),
  getChatRooms: vi.fn(),
  getChatRoomMessages: vi.fn(),
  signChatMessageTransaction: vi.fn()
}))

import chatModule from '@/store/modules/chat'
import * as admApi from '@/lib/adamant-api'
import * as chatHelpers from '@/lib/chat/helpers'

const ACCOUNT = 'U123456'
const BOUNTY = 'U15423595369615486571'
const bountyTransfer = {
  id: 'bounty-transfer',
  type: 0,
  senderId: BOUNTY,
  recipientId: ACCOUNT,
  amount: 100_000_000,
  height: 1000,
  confirmations: 1,
  timestamp: 1
}

const createChatStore = () =>
  createStore({
    state: { address: ACCOUNT, options: { useSocketConnection: true } },
    modules: {
      chat: chatModule,
      botCommands: { namespaced: true, actions: { reInitCommands() {} } }
    }
  })

const mockChatRooms = (result) => {
  vi.mocked(admApi.getChatRooms).mockResolvedValue({ count: 0, ...result })
}

const mockPolling = (messages) => {
  vi.spyOn(chatHelpers, 'getChats').mockResolvedValue({
    messages,
    lastMessageHeight: 1000,
    nodeTimestamp: 1
  })
}

describe('Store: chat unread state for a new account', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('marks the first polled transfer unread after the empty chat list was paged to the end', async () => {
    mockChatRooms({ messages: [], lastMessageHeight: 0, fetchedCount: 0 })
    mockPolling([bountyTransfer])
    const store = createChatStore()

    await store.dispatch('chat/loadChats')
    await store.dispatch('chat/loadChatsPaged')
    expect(store.state.chat.offset).toBe(-1)

    await store.dispatch('chat/getNewMessages')

    expect(store.getters['chat/numOfNewMessages'](BOUNTY)).toBe(1)
  })

  it('counts a socket-delivered transfer once when polling returns it again', async () => {
    mockChatRooms({ messages: [], lastMessageHeight: 0, fetchedCount: 0 })
    mockPolling([bountyTransfer])
    const store = createChatStore()

    await store.dispatch('chat/loadChats')
    await store.dispatch('chat/loadChatsPaged')
    await store.dispatch('chat/pushNewMessages', [
      { ...bountyTransfer, height: 0, confirmations: 0 }
    ])
    await store.dispatch('chat/getNewMessages')

    expect(store.getters['chat/numOfNewMessages'](BOUNTY)).toBe(1)
  })

  it('does not mark recovered history unread when the first chat list page was filtered out', async () => {
    mockChatRooms({ messages: [], lastMessageHeight: 0, fetchedCount: 25 })
    mockPolling([bountyTransfer])
    const store = createChatStore()

    await store.dispatch('chat/loadChats')
    await store.dispatch('chat/getNewMessages')

    expect(store.getters['chat/numOfNewMessages'](BOUNTY)).toBe(0)
  })
})
