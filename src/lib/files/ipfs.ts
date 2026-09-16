import { CID } from 'multiformats/cid'
import { code } from 'multiformats/codecs/raw'
import { create as createDigest } from 'multiformats/hashes/digest'
import { sha256 } from '@noble/hashes/sha2.js'

const SHA_256_MULTIHASH_CODE = 0x12

/**
 * Compute CID for a file
 */
export async function computeCID(fileOrBytes: File | Uint8Array) {
  const bytes =
    fileOrBytes instanceof File ? new Uint8Array(await fileOrBytes.arrayBuffer()) : fileOrBytes

  const hash = createDigest(SHA_256_MULTIHASH_CODE, sha256(bytes))
  const cid = CID.create(1, code, hash)

  return cid.toString()
}
