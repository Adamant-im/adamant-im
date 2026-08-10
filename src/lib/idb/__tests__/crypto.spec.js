import { beforeEach, describe, expect, it, vi } from 'vitest'
import nacl from 'tweetnacl/nacl-fast'
import ed2curve from 'ed2curve'
import { Buffer } from 'buffer'
import { hexToBytes } from '@/lib/hex'

const state = { password: '' }

vi.mock('@/store', () => ({
  default: {
    get state() {
      return state
    }
  }
}))

// `@/lib/idb/crypto` is mocked globally in tests/__mocks__/indexedDB.js, so the real module
// has to be imported explicitly here.
const { encrypt, decrypt } = await vi.importActual('../crypto')

/** A 32-byte scrypt output as the application stores it: a 64-character hex string. */
const PASSWORD_HASH = '0'.repeat(64)

beforeEach(() => {
  state.password = PASSWORD_HASH
})

/** The previous layout: one shared, never-initialized nonce, no per-record nonce */
function legacyEncrypt(data) {
  const secretKey = ed2curve.convertSecretKey(hexToBytes(PASSWORD_HASH))
  const nonce = new Uint8Array(24)

  return Buffer.from(nacl.secretbox(Buffer.from(JSON.stringify(data)), nonce, secretKey))
}

describe('idb/crypto', () => {
  it('uses a different nonce for every record', () => {
    const first = encrypt({ payload: 'same' })
    const second = encrypt({ payload: 'same' })

    const firstNonce = first.subarray(0, 24).toString('hex')
    const secondNonce = second.subarray(0, 24).toString('hex')

    expect(firstNonce).not.toBe(secondNonce)
    // Identical plaintext under a reused nonce would produce identical ciphertext
    expect(first.toString('hex')).not.toBe(second.toString('hex'))
  })

  it('round-trips values', () => {
    const value = { a: 1, b: 'two', c: [3, { d: null }] }

    expect(decrypt(encrypt(value))).toEqual(value)
  })

  it('prepends the nonce to the ciphertext', () => {
    const encrypted = encrypt('x')

    expect(encrypted.length).toBeGreaterThan(24)
    expect(decrypt(encrypted)).toBe('x')
  })

  it('rejects records written in the legacy shared-nonce layout', () => {
    // Deliberate: the database is cleared and rebuilt from the blockchain instead of
    // carrying a compatibility path for the broken format.
    const legacy = legacyEncrypt({ legacy: true })

    expect(() => decrypt(legacy)).toThrow(/Failed to decrypt/)
  })

  it('throws instead of returning garbage when the key does not match', () => {
    // A record encrypted under a different password must not decode, in either format
    const otherKey = ed2curve.convertSecretKey(hexToBytes('1'.repeat(64)))
    const nonce = nacl.randomBytes(24)
    const box = nacl.secretbox(Buffer.from(JSON.stringify({ secret: 1 })), nonce, otherKey)

    const current = Buffer.concat([Buffer.from(nonce), Buffer.from(box)])

    expect(() => decrypt(current)).toThrow(/Failed to decrypt/)
  })

  it('derives the encryption key from decoded hash bytes', () => {
    state.password = 'a'.repeat(64)
    const encrypted = encrypt({ secret: true })

    state.password = 'b'.repeat(64)

    expect(() => decrypt(encrypted)).toThrow(/Failed to decrypt/)
  })

  it('throws on malformed input', () => {
    expect(() => decrypt(new Uint8Array([1, 2, 3]))).toThrow(/Failed to decrypt/)
  })
})
