import { describe, it, expect, vi } from 'vitest'

/**
 *
 * Captures the reducer passed to VuexPersistence and asserts that sensitive
 * fields (passphrase, password) are never included in the persisted snapshot.
 * Any future edit to sessionStorage.js that re-adds these fields will fail
 * this test immediately.
 */

let capturedReducer

vi.mock('vuex-persist', () => ({
  default: class VuexPersistence {
    constructor(options) {
      capturedReducer = options.reducer
    }

    get plugin() {
      return () => {}
    }
  }
}))

// Import after vi.mock so the module initialises with the mocked class,
// which sets capturedReducer during construction.
await import('@/store/plugins/sessionStorage')

const mockState = {
  address: 'U12345678901234567',
  balance: 5000000000,
  passphrase: 'YWJhbmRvbiBhYmFuZG9uIGFiYW5kb24gYWJhbmRvbg==', // Base64 of a BIP39 phrase
  password: 'hashed-password-value'
}

describe('sessionStorage plugin: sensitive field exclusion', () => {
  it('does not persist passphrase to sessionStorage', () => {
    const result = capturedReducer(mockState)
    expect(result).not.toHaveProperty('passphrase')
  })

  it('does not persist password to sessionStorage', () => {
    const result = capturedReducer(mockState)
    expect(result).not.toHaveProperty('password')
  })

  it('persists non-sensitive address and balance', () => {
    const result = capturedReducer(mockState)
    expect(result.address).toBe(mockState.address)
    expect(result.balance).toBe(mockState.balance)
  })
})
