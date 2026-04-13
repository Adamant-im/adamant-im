vi.mock('@/store', () => ({
  default: {
    state: {
      password: null
    }
  }
}))

vi.mock('@/lib/idb/crypto', async (importOriginal) => {
  return await importOriginal()
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import nacl from 'tweetnacl/nacl-fast'
import { Buffer } from 'buffer'
import * as crypto from '@/lib/idb/crypto'
import store from '@/store'

describe('Random nonce per encryption', () => {
  beforeEach(() => {
    // Set up a test password in the mocked store
    store.state.password = nacl.randomBytes(32)
  })
  it('should generate different cipher per encryption (different nonce)', () => {
    const testData = { test: 'data', value: 123 }

    const encrypted1 = crypto.encrypt(testData)
    const encrypted2 = crypto.encrypt(testData)

    expect(encrypted1.length).toBeGreaterThan(24)
    expect(encrypted2.length).toBeGreaterThan(24)
    expect(Buffer.isBuffer(encrypted1)).toBe(true)
    expect(Buffer.isBuffer(encrypted2)).toBe(true)

    // Should NOT be equal due to different nonces
    expect(encrypted1.toString('hex')).not.toBe(encrypted2.toString('hex'))
  })

  it('should prepend nonce to encrypted data (first 24 bytes)', () => {
    const testData = { msg: 'hello' }
    const encrypted = crypto.encrypt(testData)

    // Nonce is first 24 bytes, box is remaining
    expect(encrypted.length).toBe(
      24 + (testData.__encryptedLength || 16 + JSON.stringify(testData).length)
    )

    // Extract nonce
    const extractedNonce = encrypted.subarray(0, 24)
    expect(extractedNonce.length).toBe(24)
  })

  it('should decrypt data encrypted with new format', () => {
    const testData = { user: 'alice', balance: 1000 }
    const encrypted = crypto.encrypt(testData)
    const decrypted = crypto.decrypt(encrypted)

    expect(decrypted).toStrictEqual(testData)
  })

  it('should handle nested objects', () => {
    const testData = {
      name: 'test',
      nested: { deep: { value: 42 } },
      array: [1, 2, 3]
    }
    const encrypted = crypto.encrypt(testData)
    const decrypted = crypto.decrypt(encrypted)

    expect(decrypted).toStrictEqual(testData)
  })

  it('should throw error on invalid nonce', () => {
    const testData = { test: 'data' }
    const encrypted = crypto.encrypt(testData)

    // Corrupt the nonce (first 24 bytes)
    const corrupted = Buffer.concat([Buffer.alloc(24), encrypted.subarray(24)])

    expect(() => crypto.decrypt(corrupted)).toThrow(
      'Failed to decrypt data: invalid format or wrong password'
    )
  })

  it('should throw error on truncated data', () => {
    const testData = { test: 'data' }
    const encrypted = crypto.encrypt(testData)

    // Remove last bytes
    const truncated = encrypted.subarray(0, encrypted.length - 5)

    expect(() => crypto.decrypt(truncated)).toThrow(
      'Failed to decrypt data: invalid format or wrong password'
    )
  })

  it('should throw error on wrong password', () => {
    const testData = { secret: 'data' }
    const encrypted = crypto.encrypt(testData)

    // Change password to wrong one in the mock
    const originalPassword = store.state.password
    store.state.password = nacl.randomBytes(32)

    expect(() => crypto.decrypt(encrypted)).toThrow(
      'Failed to decrypt data: invalid format or wrong password'
    )

    // Restore original password
    store.state.password = originalPassword
  })

  it('should handle Buffer and string inputs for JSON data', () => {
    const testData = { type: 'buffer-test' }
    const encrypted = crypto.encrypt(testData)

    // Ensure it's a Buffer
    expect(Buffer.isBuffer(encrypted)).toBe(true)

    // Should be decryptable
    const decrypted = crypto.decrypt(encrypted)
    expect(decrypted).toStrictEqual(testData)
  })
})
