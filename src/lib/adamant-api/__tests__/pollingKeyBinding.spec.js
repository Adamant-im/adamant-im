import { beforeEach, describe, expect, it, vi } from 'vitest'

import utils from '@/lib/adamant'

/**
 * The polling path accepts public keys from the node exactly like the socket does, so it needs
 * the same binding check. It was missed in the first pass: `getChats()` used
 * `Promise.resolve(transaction.senderPublicKey)` for incoming transactions, and
 * `chat/getNewMessages` calls it continuously, so a compromised node could substitute its own
 * key together with a matching ciphertext and the message would decode as if a trusted contact
 * had sent it.
 */
const requests = []
let chatsResponse = { count: 0, transactions: [], nodeTimestamp: 0 }

const state = { address: '', password: '', publicKeys: {} }
const store = {
  state,
  getters: { publicKey: (address) => state.publicKeys[address] },
  commit: vi.fn((mutation, payload) => {
    if (mutation === 'setPublicKey') {
      state.publicKeys[payload.adamantAddress] = payload.publicKey
    }
  })
}

vi.mock('@/store', () => ({ default: store }))

// `unlock()` derives a keypair through sodium, whose `instanceof Uint8Array` check fails across
// the Buffer realms vitest sets up. Only the resulting address matters here, so the derivation
// is stubbed and everything else comes from the real module.
vi.mock('@/lib/adamant', async () => {
  const actual = await vi.importActual('@/lib/adamant')
  const publicKey = Buffer.from('ab'.repeat(32), 'hex')

  return {
    default: {
      ...actual.default,
      createPassphraseHash: () => Buffer.alloc(32),
      makeKeypair: () => ({ publicKey, privateKey: Buffer.alloc(64) }),
      decodeMessage: () => 'decoded message'
    }
  }
})
vi.mock('@/i18n', () => ({ i18n: { global: { t: (key) => key } } }))
vi.mock('@/lib/nodes/adm', () => ({
  default: {
    get: vi.fn((url, params) => {
      requests.push({ url, params })

      return Promise.resolve(chatsResponse)
    }),
    post: vi.fn(),
    nodes: []
  }
}))

const api = await import('../index')

const OWN_KEY = 'ab'.repeat(32)
const PARTNER_KEY = 'cd'.repeat(32)
const ATTACKER_KEY = 'ef'.repeat(32)
const OWN_ADDRESS = utils.getAddressFromPublicKey(OWN_KEY)
const PARTNER_ADDRESS = utils.getAddressFromPublicKey(PARTNER_KEY)

function incomingTransaction(senderPublicKey) {
  return {
    id: '1',
    type: 8,
    senderId: PARTNER_ADDRESS,
    recipientId: OWN_ADDRESS,
    senderPublicKey,
    asset: { chat: { type: 1, message: 'ff', own_message: 'ee' } }
  }
}

beforeEach(() => {
  requests.length = 0
  state.publicKeys = {}
  state.address = OWN_ADDRESS
  store.commit.mockClear()
  // `getChats` reads the unlocked address from module state
  api.unlock('stub passphrase')
})

describe('getChats key binding', () => {
  it('drops an incoming transaction whose key does not derive the sender address', async () => {
    chatsResponse = {
      count: 1,
      transactions: [incomingTransaction(ATTACKER_KEY)],
      nodeTimestamp: 0
    }

    const result = await api.getChats()

    expect(result.transactions).toHaveLength(0)
    // Nothing about the rejected key survives
    expect(state.publicKeys[PARTNER_ADDRESS]).toBeUndefined()
    // And no extra request was made trying to recover
    expect(requests).toHaveLength(1)
  })

  it('caches a key that does derive the sender address', async () => {
    chatsResponse = { count: 1, transactions: [incomingTransaction(PARTNER_KEY)], nodeTimestamp: 0 }

    await api.getChats()

    expect(state.publicKeys[PARTNER_ADDRESS]).toBe(PARTNER_KEY)
    expect(requests).toHaveLength(1)
  })
})
