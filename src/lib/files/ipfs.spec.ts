import { afterEach, describe, expect, it, vi } from 'vitest'

import { sha256 } from '@noble/hashes/sha2.js'
import { code } from 'multiformats/codecs/raw'
import { CID } from 'multiformats/cid'
import { create as createDigest } from 'multiformats/hashes/digest'

import { computeCID } from './ipfs'

const SHA_256_MULTIHASH_CODE = 0x12

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('computeCID', () => {
  it('computes the raw SHA-256 CID when crypto.subtle is unavailable', async () => {
    vi.stubGlobal('crypto', { subtle: undefined })

    const bytes = new Uint8Array([1, 2, 3])
    const expectedCid = CID.create(
      1,
      code,
      createDigest(SHA_256_MULTIHASH_CODE, sha256(bytes))
    ).toString()

    await expect(computeCID(bytes)).resolves.toBe(expectedCid)
  })
})
