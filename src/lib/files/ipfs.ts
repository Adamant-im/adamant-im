import { CID } from 'multiformats/cid'
import { code } from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'

/**
 * Compute CID for a file
 */
export async function computeCID(fileOrBytes: File | Uint8Array) {
  const bytes =
    fileOrBytes instanceof File ? new Uint8Array(await fileOrBytes.arrayBuffer()) : fileOrBytes

  const hash = await sha256.digest(bytes)
  const cid = CID.create(1, code, hash)

  return cid.toString()
}
