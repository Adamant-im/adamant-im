import { CID } from 'multiformats/cid'
import { code } from 'multiformats/codecs/raw'
import { create as createDigest } from 'multiformats/hashes/digest'
import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js'

const SHA_256_MULTIHASH_CODE = 0x12

async function digestSha256(bytes: Uint8Array) {
  const subtle = globalThis.crypto?.subtle

  if (subtle) {
    const digestInput =
      bytes.buffer instanceof ArrayBuffer
        ? bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
          ? bytes.buffer
          : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
        : bytes.slice().buffer

    return new Uint8Array(await subtle.digest('SHA-256', digestInput))
  }

  return nobleSha256(bytes)
}

/**
 * Compute CID for a file
 */
export async function computeCID(fileOrBytes: File | Uint8Array) {
  const bytes =
    fileOrBytes instanceof File ? new Uint8Array(await fileOrBytes.arrayBuffer()) : fileOrBytes

  const hash = createDigest(SHA_256_MULTIHASH_CODE, await digestSha256(bytes))
  const cid = CID.create(1, code, hash)

  return cid.toString()
}
