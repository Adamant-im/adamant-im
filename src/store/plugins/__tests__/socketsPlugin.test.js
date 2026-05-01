import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Security regression tests for socketsPlugin:
 * Incoming socket messages must resolve the sender's public key via getPublicKey()
 * (which performs cross-node verification) rather than trusting the key
 * supplied directly in the socket payload.
 * If getPublicKey() rejects (e.g. key mismatch between nodes), the message
 * must NOT be dispatched to the store.
 */

const MY_ADDRESS = 'U1111111111111111111'
const SENDER_ADDRESS = 'U2222222222222222222'
const SENDER_PUBLIC_KEY = 'aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666aaaa1111bbbb2222'

// --- socket mock ---
let subscribedCallback = null
const mockSocketClient = {
  subscribe: vi.fn((event, cb) => {
    if (event === 'newMessage') subscribedCallback = cb
  }),
  setSocketEnabled: vi.fn(),
  init: vi.fn(),
  destroy: vi.fn(),
  setNodes: vi.fn(),
  setUseFastest: vi.fn()
}

// --- adamant-api mock ---
const mockGetPublicKey = vi.fn()
const mockDecodeChat = vi.fn((tx) => ({ ...tx, message: 'decoded' }))

// --- store mock ---
const mockDispatch = vi.fn()
const mockStore = {
  state: {
    address: MY_ADDRESS,
    options: { useSocketConnection: true },
    chat: { isFulfilled: false }
  },
  getters: { 'nodes/adm': [] },
  watch: vi.fn(),
  subscribe: vi.fn(),
  dispatch: mockDispatch
}

vi.mock('@/lib/sockets', () => ({ default: mockSocketClient }))
vi.mock('@/lib/adamant-api', () => ({
  getPublicKey: mockGetPublicKey,
  decodeChat: mockDecodeChat
}))
vi.mock('@/lib/textHelpers', () => ({
  isStringEqualCI: (a, b) => a?.toLowerCase() === b?.toLowerCase()
}))
vi.mock('@/utils/devTools/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn() }
}))

await import('@/store/plugins/socketsPlugin').then((m) => m.default(mockStore))

beforeEach(() => {
  vi.clearAllMocks()
  mockDispatch.mockReset()
})

/** Flush all pending microtasks so that promise .then() callbacks run */
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('socketsPlugin: incoming message key resolution', () => {
  it('calls getPublicKey(senderId) — not the socket payload key — when we are the recipient', async () => {
    mockGetPublicKey.mockResolvedValue(SENDER_PUBLIC_KEY)

    const tx = {
      type: 8,
      senderId: SENDER_ADDRESS,
      recipientId: MY_ADDRESS,
      senderPublicKey: 'evil_key_from_socket',
      asset: { chat: { message: 'ciphertext', own_message: 'nonce', type: 1 } }
    }

    subscribedCallback(tx)
    await flushPromises()

    expect(mockGetPublicKey).toHaveBeenCalledWith(SENDER_ADDRESS)
    expect(mockGetPublicKey).not.toHaveBeenCalledWith('evil_key_from_socket')
  })

  it('dispatches decoded message when getPublicKey resolves', async () => {
    mockGetPublicKey.mockResolvedValue(SENDER_PUBLIC_KEY)

    const tx = {
      type: 8,
      senderId: SENDER_ADDRESS,
      recipientId: MY_ADDRESS,
      senderPublicKey: 'evil_key_from_socket',
      asset: { chat: { message: 'ciphertext', own_message: 'nonce', type: 1 } }
    }

    subscribedCallback(tx)
    await flushPromises()

    expect(mockDispatch).toHaveBeenCalledWith('chat/pushMessages', expect.any(Array))
  })

  it('does NOT dispatch the message when getPublicKey rejects (key mismatch / attack)', async () => {
    mockGetPublicKey.mockRejectedValue(new Error('chats.public_key_mismatch'))

    const tx = {
      type: 8,
      senderId: SENDER_ADDRESS,
      recipientId: MY_ADDRESS,
      senderPublicKey: 'evil_key_from_socket',
      asset: { chat: { message: 'ciphertext', own_message: 'nonce', type: 1 } }
    }

    subscribedCallback(tx)
    await flushPromises()

    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
