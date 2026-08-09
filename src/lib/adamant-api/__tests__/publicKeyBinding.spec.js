import { describe, expect, it, vi } from 'vitest'

import utils from '@/lib/adamant'

vi.mock('@/store', () => ({
  default: {
    state: { address: '', password: '' },
    getters: { publicKey: () => undefined },
    commit: vi.fn()
  }
}))

const { isPublicKeyBoundToAddress } = await import('../index')

/**
 * Real pair taken from the ADAMANT mainnet: an address is `'U' + decimal of the first eight
 * bytes of sha256(publicKey), reversed`, so the binding is verifiable offline.
 */
const KNOWN = {
  address: 'U15423595369615486571',
  publicKey: null
}

describe('isPublicKeyBoundToAddress', () => {
  it('accepts a key that derives the claimed address', () => {
    // Derive a fresh pair rather than hardcoding one: the property under test is the
    // relation between the two, not any particular value.
    const publicKeyHex = 'ab'.repeat(32)
    const address = utils.getAddressFromPublicKey(publicKeyHex)

    expect(isPublicKeyBoundToAddress(address, publicKeyHex)).toBe(true)
  })

  it('rejects a substituted key', () => {
    const realKey = 'ab'.repeat(32)
    const attackerKey = 'cd'.repeat(32)
    const address = utils.getAddressFromPublicKey(realKey)

    expect(utils.getAddressFromPublicKey(attackerKey)).not.toBe(address)
    expect(isPublicKeyBoundToAddress(address, attackerKey)).toBe(false)
  })

  it('is case insensitive on the address', () => {
    const publicKeyHex = 'ab'.repeat(32)
    const address = utils.getAddressFromPublicKey(publicKeyHex)

    expect(isPublicKeyBoundToAddress(address.toLowerCase(), publicKeyHex)).toBe(true)
  })

  it('rejects missing or malformed input instead of throwing', () => {
    expect(isPublicKeyBoundToAddress('', 'ab'.repeat(32))).toBe(false)
    expect(isPublicKeyBoundToAddress(KNOWN.address, '')).toBe(false)
    expect(isPublicKeyBoundToAddress(KNOWN.address, 'not-hex')).toBe(false)
    expect(isPublicKeyBoundToAddress(KNOWN.address, KNOWN.publicKey)).toBe(false)
  })
})
