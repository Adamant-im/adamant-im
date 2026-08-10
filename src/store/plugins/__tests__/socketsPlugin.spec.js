import { beforeEach, describe, expect, it, vi } from 'vitest'

import utils from '@/lib/adamant'

/**
 * The realtime path must stay free of network round trips.
 *
 * Before the binding check existed, an incoming message used the key from the payload (no
 * request) while the echo of an outgoing one resolved the key through `getPublicKey` (a request
 * whenever the cache missed). Verifying the key locally removed that call, so the socket handler
 * now costs nothing in either direction — and these assertions keep it that way.
 */
const handlers = {}
const getPublicKey = vi.fn()
const cacheVerifiedPublicKey = vi.fn()
const decodeChat = vi.fn((transaction) => ({ ...transaction, decoded: true }))

vi.mock('@/lib/sockets', () => ({
  default: {
    subscribe: (event, callback) => {
      handlers[event] = callback
    },
    setSocketEnabled: vi.fn(),
    setNodes: vi.fn(),
    setUseFastest: vi.fn(),
    init: vi.fn(),
    destroy: vi.fn()
  }
}))

vi.mock('@/lib/adamant-api', () => ({
  cacheVerifiedPublicKey: (...args) => cacheVerifiedPublicKey(...args),
  decodeChat: (...args) => decodeChat(...args),
  getPublicKey: (...args) => getPublicKey(...args)
}))

const { default: socketsPlugin } = await import('../socketsPlugin')

const OWN_KEY = 'ab'.repeat(32)
const PARTNER_KEY = 'cd'.repeat(32)
const OWN_ADDRESS = utils.getAddressFromPublicKey(OWN_KEY)
const PARTNER_ADDRESS = utils.getAddressFromPublicKey(PARTNER_KEY)

function createStore() {
  return {
    state: {
      address: OWN_ADDRESS,
      options: { useSocketConnection: true },
      chat: { isFulfilled: false }
    },
    getters: { 'nodes/adm': [] },
    dispatch: vi.fn(() => Promise.resolve()),
    watch: vi.fn(),
    subscribe: vi.fn()
  }
}

function incoming(overrides = {}) {
  return {
    type: 8,
    id: '1',
    senderId: PARTNER_ADDRESS,
    recipientId: OWN_ADDRESS,
    senderPublicKey: PARTNER_KEY,
    recipientPublicKey: OWN_KEY,
    asset: { chat: { type: 1, message: 'ff', own_message: 'ee' } },
    ...overrides
  }
}

function outgoing(overrides = {}) {
  return incoming({
    senderId: OWN_ADDRESS,
    recipientId: PARTNER_ADDRESS,
    senderPublicKey: OWN_KEY,
    recipientPublicKey: PARTNER_KEY,
    ...overrides
  })
}

let store

beforeEach(() => {
  getPublicKey.mockReset()
  cacheVerifiedPublicKey.mockReset().mockReturnValue(true)
  decodeChat.mockClear()
  store = createStore()
  socketsPlugin(store)
})

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('socketsPlugin request budget', () => {
  it('makes no request for an incoming message', async () => {
    handlers.newMessage(incoming())
    await flush()

    expect(getPublicKey).not.toHaveBeenCalled()
    expect(cacheVerifiedPublicKey).toHaveBeenCalledWith(PARTNER_ADDRESS, PARTNER_KEY)
    expect(store.dispatch).toHaveBeenCalledWith('chat/pushMessages', [expect.anything()])
  })

  it('makes no request for the echo of an outgoing message', async () => {
    // This is the direction that used to call `getPublicKey` on every cache miss
    handlers.newMessage(outgoing())
    await flush()

    expect(getPublicKey).not.toHaveBeenCalled()
    expect(cacheVerifiedPublicKey).toHaveBeenCalledWith(PARTNER_ADDRESS, PARTNER_KEY)
  })

  it('drops the message when the key does not derive the address, without retrying', async () => {
    cacheVerifiedPublicKey.mockReturnValue(false)

    handlers.newMessage(incoming({ senderPublicKey: OWN_KEY }))
    await flush()

    expect(getPublicKey).not.toHaveBeenCalled()
    expect(store.dispatch).not.toHaveBeenCalled()
  })

  it('falls back to the cache-first lookup only when a node omits the key', async () => {
    // Older nodes may not include `recipientPublicKey`; `getPublicKey` answers from cache when
    // it can, so this stays free in the common case
    getPublicKey.mockResolvedValue(PARTNER_KEY)

    handlers.newMessage(outgoing({ recipientPublicKey: undefined }))
    await flush()

    expect(getPublicKey).toHaveBeenCalledWith(PARTNER_ADDRESS)
    expect(store.dispatch).toHaveBeenCalledWith('chat/pushMessages', [expect.anything()])
  })

  it('does not push signal messages into the chat', async () => {
    handlers.newMessage(
      incoming({ asset: { chat: { type: 3, message: 'ff', own_message: 'ee' } } })
    )
    await flush()

    expect(store.dispatch).not.toHaveBeenCalled()
    expect(cacheVerifiedPublicKey).not.toHaveBeenCalled()
    expect(getPublicKey).not.toHaveBeenCalled()
    expect(decodeChat).not.toHaveBeenCalled()
  })
})
