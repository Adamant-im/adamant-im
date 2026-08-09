import { describe, expect, it, vi } from 'vitest'

import utils from '@/lib/adamant'

vi.mock('@/store', () => ({
  default: {
    state: { address: '', password: '' },
    getters: { publicKey: () => undefined },
    commit: vi.fn()
  }
}))

const { decodeTransaction, getVerifiedCounterpartyPublicKey } = await import('../index')

const MY_KEY = 'aa'.repeat(32)
const PARTNER_KEY = 'bb'.repeat(32)
const HOSTILE_KEY = 'cc'.repeat(32)

const MY_ADDRESS = utils.getAddressFromPublicKey(MY_KEY)
const PARTNER_ADDRESS = utils.getAddressFromPublicKey(PARTNER_KEY)

const incoming = (overrides = {}) => ({
  id: '1234567890',
  type: 8,
  senderId: PARTNER_ADDRESS,
  senderPublicKey: PARTNER_KEY,
  recipientId: MY_ADDRESS,
  recipientPublicKey: MY_KEY,
  asset: { chat: { message: 'deadbeef', own_message: 'beefdead', type: 1 } },
  ...overrides
})

/**
 * `/api/transactions/get` is a single-transaction fetch, so nothing else has had a chance to
 * check the keys it carries. It reaches the user through transaction details and through a
 * quoted message, both of which render the decoded text as the counterparty's words.
 */
describe('direct transaction fetch key binding', () => {
  it('accepts the counterparty key when it derives the address it is attributed to', () => {
    expect(getVerifiedCounterpartyPublicKey(incoming(), MY_ADDRESS)).toBe(PARTNER_KEY)
  })

  it('rejects a substituted sender key on an incoming transaction', () => {
    expect(() =>
      getVerifiedCounterpartyPublicKey(incoming({ senderPublicKey: HOSTILE_KEY }), MY_ADDRESS)
    ).toThrow(/does not derive the address/)
  })

  it('rejects a substituted recipient key on an outgoing transaction', () => {
    const outgoing = incoming({
      senderId: MY_ADDRESS,
      senderPublicKey: MY_KEY,
      recipientId: PARTNER_ADDRESS,
      recipientPublicKey: HOSTILE_KEY
    })

    expect(() => getVerifiedCounterpartyPublicKey(outgoing, MY_ADDRESS)).toThrow(
      /does not derive the address/
    )
  })

  it('does not decode a chat message carrying an unbound key', () => {
    expect(() => decodeTransaction(incoming({ senderPublicKey: HOSTILE_KEY }), MY_ADDRESS)).toThrow(
      /does not derive the address/
    )
  })

  it('leaves plain ADM transfers alone, they carry nothing to decode', () => {
    const transfer = { id: '42', type: 0, senderId: PARTNER_ADDRESS, recipientId: MY_ADDRESS }

    expect(decodeTransaction(transfer, MY_ADDRESS)).toBe(transfer)
  })

  it('matches the address case-insensitively, as the rest of the API does', () => {
    const transaction = incoming({ recipientId: MY_ADDRESS.toLowerCase() })

    expect(getVerifiedCounterpartyPublicKey(transaction, MY_ADDRESS)).toBe(PARTNER_KEY)
  })
})
