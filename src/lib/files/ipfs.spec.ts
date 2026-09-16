import { afterEach, describe, expect, it, vi } from 'vitest'

import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js'
import { code } from 'multiformats/codecs/raw'
import { CID } from 'multiformats/cid'
import { create as createDigest } from 'multiformats/hashes/digest'

import { computeCID } from './ipfs'

const SHA_256_MULTIHASH_CODE = 0x12

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('computeCID', () => {
  it('prefers Web Crypto when crypto.subtle is available', async () => {
    const digestBytes = new Uint8Array(Array.from({ length: 32 }, (_value, index) => index))
    const digest = vi.fn().mockResolvedValue(digestBytes.buffer)
    vi.stubGlobal('crypto', { subtle: { digest } })

    const bytes = new Uint8Array([1, 2, 3])
    const expectedCid = CID.create(
      1,
      code,
      createDigest(SHA_256_MULTIHASH_CODE, digestBytes)
    ).toString()
    const expectedInput = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)

    await expect(computeCID(bytes)).resolves.toBe(expectedCid)
    expect(digest).toHaveBeenCalledWith('SHA-256', expectedInput)
  })

  it('computes the raw SHA-256 CID when crypto.subtle is unavailable', async () => {
    vi.stubGlobal('crypto', { subtle: undefined })

    const bytes = new Uint8Array([1, 2, 3])
    const expectedCid = CID.create(
      1,
      code,
      createDigest(SHA_256_MULTIHASH_CODE, nobleSha256(bytes))
    ).toString()

    await expect(computeCID(bytes)).resolves.toBe(expectedCid)
  })
})
