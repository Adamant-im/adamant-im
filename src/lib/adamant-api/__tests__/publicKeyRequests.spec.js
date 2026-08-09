import { beforeEach, describe, expect, it, vi } from 'vitest'

import utils from '@/lib/adamant'

/**
 * Guards the request budget of the public key path.
 *
 * The verification work added to `getPublicKey`, `getChatRooms` and the socket handler is local
 * arithmetic — an address is derived from the public key with one hash — so it must not cost a
 * single extra round trip. An earlier draft polled a second node for every address, which is
 * exactly what these assertions exist to prevent from coming back.
 */
const requests = []

const state = { address: '', password: '', publicKeys: {} }
const store = {
  state,
  getters: {
    publicKey: (address) => state.publicKeys[address]
  },
  commit: vi.fn((mutation, payload) => {
    if (mutation === 'setPublicKey') {
      state.publicKeys[payload.adamantAddress] = payload.publicKey
    }
  })
}

vi.mock('@/store', () => ({ default: store }))

vi.mock('@/lib/nodes/adm', () => ({
  default: {
    get: vi.fn((url, params) => {
      requests.push({ url, params })

      const publicKey = pendingResponses.shift()

      return Promise.resolve({ publicKey })
    }),
    post: vi.fn(),
    nodes: []
  }
}))

vi.mock('@/i18n', () => ({
  i18n: { global: { t: (key) => key } }
}))

let pendingResponses = []

const { getPublicKey, cacheVerifiedPublicKey, isPublicKeyBoundToAddress } = await import('../index')

/** A real key/address pair: the address is derived from the key, so the binding holds */
const KEY = 'ab'.repeat(32)
const ADDRESS = utils.getAddressFromPublicKey(KEY)
const OTHER_KEY = 'cd'.repeat(32)

beforeEach(() => {
  requests.length = 0
  pendingResponses = []
  state.address = ''
  state.publicKeys = {}
  store.commit.mockClear()
})

describe('public key request budget', () => {
  it('makes exactly one request for an address that is not cached', async () => {
    pendingResponses = [KEY]

    await expect(getPublicKey(ADDRESS)).resolves.toBe(KEY)

    // One request, not two: verification is local, there is no second node to poll
    expect(requests).toHaveLength(1)
    expect(requests[0].url).toBe('/api/accounts/getPublicKey')
  })

  it('makes no request for an address already in the cache', async () => {
    state.publicKeys[ADDRESS] = KEY

    await expect(getPublicKey(ADDRESS)).resolves.toBe(KEY)
    expect(requests).toHaveLength(0)
  })

  it('caches the answer, so a second call costs nothing', async () => {
    pendingResponses = [KEY]

    await getPublicKey(ADDRESS)
    await getPublicKey(ADDRESS)
    await getPublicKey(ADDRESS)

    expect(requests).toHaveLength(1)
    expect(state.publicKeys[ADDRESS]).toBe(KEY)
  })

  it('makes no request for the user own address', async () => {
    state.address = ADDRESS
    state.publicKeys[ADDRESS] = KEY

    await getPublicKey(ADDRESS)
    expect(requests).toHaveLength(0)
  })

  it('keys cached from a bulk chatroom response are not fetched again', async () => {
    // This is the app's main source of public keys: one chatroom response caches many of them
    const partners = ['11', '22', '33'].map((byte) => {
      const publicKey = byte.repeat(32)

      return { publicKey, address: utils.getAddressFromPublicKey(publicKey) }
    })

    for (const partner of partners) {
      expect(cacheVerifiedPublicKey(partner.address, partner.publicKey)).toBe(true)
    }

    for (const partner of partners) {
      await expect(getPublicKey(partner.address)).resolves.toBe(partner.publicKey)
    }

    expect(requests).toHaveLength(0)
  })

  it('does not cache or retry when the node answers with a key that is not bound to the address', async () => {
    pendingResponses = [OTHER_KEY]

    await expect(getPublicKey(ADDRESS)).rejects.toThrow('chats.public_key_mismatch')

    // One request, then it gives up — no fallback poll, and nothing poisoned the cache
    expect(requests).toHaveLength(1)
    expect(state.publicKeys[ADDRESS]).toBeUndefined()
  })

  it('rejects an unbound key without touching the network at all', () => {
    expect(isPublicKeyBoundToAddress(ADDRESS, OTHER_KEY)).toBe(false)
    expect(cacheVerifiedPublicKey(ADDRESS, OTHER_KEY)).toBe(false)
    expect(requests).toHaveLength(0)
    expect(state.publicKeys[ADDRESS]).toBeUndefined()
  })
})
