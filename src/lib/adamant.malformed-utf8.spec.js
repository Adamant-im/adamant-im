import { sha256 } from '@noble/hashes/sha2.js'
import ed2curve from 'ed2curve'
import nacl from 'tweetnacl/nacl-fast'
import { describe, expect, it } from 'vitest'

import adamant from './adamant'

describe('adamant malformed utf8 handling', () => {
  it('rejects authenticated private values with malformed utf8', () => {
    const owner = adamant.makeKeypair(Buffer.alloc(32, 88))
    const secretKey = ed2curve.convertSecretKey(sha256(owner.privateKey))

    if (!secretKey) {
      throw new Error('Failed to derive the test encryption key')
    }

    const nonce = nacl.randomBytes(24)
    const malformedJson = Buffer.concat([
      Buffer.from('padding{"payload":"'),
      Buffer.from([0xff]),
      Buffer.from('"}padding')
    ])
    const encrypted = nacl.secretbox(Uint8Array.from(malformedJson), nonce, secretKey)

    expect(() => adamant.decodeValue(encrypted, owner.privateKey, nonce)).toThrow()
  })
})
