import utils from '@/lib/adamant'
import { hexToBytes } from '@/lib/hex'
import ipfs from '@/lib/nodes/ipfs'
import { Buffer } from 'buffer'
import { NACL_BOX_OVERHEAD, UPLOAD_MAX_FILE_SIZE } from '@/lib/constants'

export class AttachmentApi {
  public readonly myKeypair: { publicKey: Buffer; privateKey: Buffer }
  constructor(passphrase: string) {
    const hash = utils.createPassphraseHash(passphrase)
    this.myKeypair = utils.makeKeypair(hash) as { publicKey: Buffer; privateKey: Buffer }
  }

  /**
   * @param maxSize size declared in the transaction the attachment belongs to.
   *   Bounded by the global upload limit, so a caller that does not know the declared size
   *   still cannot be made to buffer an unbounded response.
   */
  async getFile(cid: string, nonce: string, publicKey: string, maxSize?: number) {
    const file = (await ipfs.downloadFile(cid)) as ArrayBuffer

    // The IPFS node is not trusted to return what the transaction says it will return, and
    // image previews are fetched automatically, so the size has to be checked before the
    // payload is decrypted.
    const declaredLimit =
      typeof maxSize === 'number' && maxSize > 0 ? maxSize : UPLOAD_MAX_FILE_SIZE
    const sizeLimit = Math.min(declaredLimit, UPLOAD_MAX_FILE_SIZE) + NACL_BOX_OVERHEAD

    if (file.byteLength > sizeLimit) {
      throw new Error(
        `Downloaded file size ${file.byteLength} exceeds the allowed limit of ${sizeLimit} bytes`
      )
    }

    return utils.decodeBinary(new Uint8Array(file), publicKey, this.myKeypair.privateKey, nonce)
  }

  async uploadFile(file: Uint8Array, publicKey: string) {
    const formData = new FormData()
    const { binary, nonce } = utils.encodeBinary(
      file,
      hexToBytes(publicKey),
      this.myKeypair.privateKey
    )
    formData.append('file', binary)

    const { cids } = await ipfs.post(`api/file/upload`, formData, {
      'Content-Type': 'multipart/form-data'
    })

    // The plaintext file bytes and the recipient public key are deliberately not logged:
    // the log level is persisted to localStorage, so a single setLevel('info') would arm
    // plaintext logging for every future upload.
    return { cids, nonce }
  }
}
