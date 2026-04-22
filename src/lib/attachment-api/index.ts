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

  async getFile(cid: string, nonce: string, publicKey: string, maxSize?: number) {
    const file = await ipfs.downloadFile(cid)
    const sizeLimit =
      Math.min(maxSize ?? UPLOAD_MAX_FILE_SIZE, UPLOAD_MAX_FILE_SIZE) + NACL_BOX_OVERHEAD
    if ((file as ArrayBuffer).byteLength > sizeLimit) {
      throw new Error(`Downloaded file size exceeds declared size`)
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

    return { cids, nonce }
  }
}
