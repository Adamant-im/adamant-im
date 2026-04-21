import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Security regression tests:
 * getPublicKey must cross-verify the result with a second node before caching.
 * A mismatch between nodes must be treated as a potential MITM attack.
 */

const ADDR = 'U1234567890123456789'
const KEY_A = 'aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666aaaa1111bbbb2222'
const KEY_B = 'bbbb2222cccc3333dddd4444eeee5555ffff6666aaaa1111bbbb2222cccc3333'

const mockAltNode = {
  url: 'https://node-alt.example',
  request: vi.fn()
}

const mockClient = {
  lastUsedNodeUrl: 'https://node-first.example',
  getAlternativeNodeUrl: vi.fn(),
  nodes: [mockAltNode],
  get: vi.fn()
}

const mockCommit = vi.fn()
const mockStore = {
  state: { address: 'U0000000000000000001' },
  getters: { publicKey: vi.fn(() => null) },
  commit: mockCommit
}

vi.mock('@/lib/nodes/adm', () => ({ default: mockClient }))
vi.mock('@/store', () => ({ default: mockStore }))
vi.mock('@/i18n', () => ({
  i18n: {
    global: {
      t: (key) => key
    }
  }
}))
vi.mock('@/utils/devTools/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn() }
}))

const { getPublicKey } = await import('@/lib/adamant-api/index.js')

beforeEach(() => {
  vi.clearAllMocks()
  mockStore.getters.publicKey.mockReturnValue(null)
  mockClient.lastUsedNodeUrl = 'https://node-first.example'
  mockClient.getAlternativeNodeUrl.mockReturnValue(mockAltNode.url)
  mockClient.nodes = [mockAltNode]
})

describe('getPublicKey: cross-node verification', () => {
  it('returns cached key without any node request', async () => {
    mockStore.getters.publicKey.mockReturnValue(KEY_A)

    const result = await getPublicKey(ADDR)

    expect(result).toBe(KEY_A)
    expect(mockClient.get).not.toHaveBeenCalled()
    expect(mockAltNode.request).not.toHaveBeenCalled()
  })

  it('caches and returns key when both nodes agree', async () => {
    mockClient.get.mockResolvedValue({ publicKey: KEY_A })
    mockAltNode.request.mockResolvedValue({ publicKey: KEY_A })

    const result = await getPublicKey(ADDR)

    expect(result).toBe(KEY_A)
    expect(mockCommit).toHaveBeenCalledWith('setPublicKey', {
      adamantAddress: ADDR,
      publicKey: KEY_A
    })
  })

  it('throws security error when nodes return different keys', async () => {
    mockClient.get.mockResolvedValue({ publicKey: KEY_A })
    mockAltNode.request.mockResolvedValue({ publicKey: KEY_B })

    await expect(getPublicKey(ADDR)).rejects.toThrow('chats.public_key_mismatch')
    expect(mockCommit).not.toHaveBeenCalled()
  })

  it('caches key with warning when only one node is available', async () => {
    const { logger } = await import('@/utils/devTools/logger')
    mockClient.get.mockResolvedValue({ publicKey: KEY_A })
    mockClient.getAlternativeNodeUrl.mockReturnValue(null)

    const result = await getPublicKey(ADDR)

    expect(result).toBe(KEY_A)
    expect(mockCommit).toHaveBeenCalledWith('setPublicKey', {
      adamantAddress: ADDR,
      publicKey: KEY_A
    })
    expect(logger.warn).toHaveBeenCalled()
  })

  it('falls back to first-node result with warning when second node request fails', async () => {
    const { logger } = await import('@/utils/devTools/logger')
    mockClient.get.mockResolvedValue({ publicKey: KEY_A })
    mockAltNode.request.mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await getPublicKey(ADDR)

    expect(result).toBe(KEY_A)
    expect(mockCommit).toHaveBeenCalledWith('setPublicKey', {
      adamantAddress: ADDR,
      publicKey: KEY_A
    })
    expect(logger.warn).toHaveBeenCalled()
  })

  it('accepts first-node result with warning when second node has no key yet', async () => {
    const { logger } = await import('@/utils/devTools/logger')
    mockClient.get.mockResolvedValue({ publicKey: KEY_A })
    mockAltNode.request.mockResolvedValue({ publicKey: null })

    const result = await getPublicKey(ADDR)

    expect(result).toBe(KEY_A)
    expect(mockCommit).toHaveBeenCalledWith('setPublicKey', {
      adamantAddress: ADDR,
      publicKey: KEY_A
    })
    expect(logger.warn).toHaveBeenCalled()
  })

  it('throws when first node returns no public key', async () => {
    mockClient.get.mockResolvedValue({ publicKey: null })

    await expect(getPublicKey(ADDR)).rejects.toThrow('chats.no_public_key')
    expect(mockCommit).not.toHaveBeenCalled()
  })
})
