import utils from '@/lib/adamant'
import ipfs from '@/lib/nodes/ipfs'
import { Buffer } from 'buffer'

export class AttachmentApi {
  public readonly myKeypair: { publicKey: Buffer; privateKey: Buffer }
  constructor(passphrase: string) {
    const hash = utils.createPassphraseHash(passphrase)
    this.myKeypair = utils.makeKeypair(hash) as { publicKey: Buffer; privateKey: Buffer }
  }

  async getFile(cid: string, nonce: string, publicKey: Uint8Array) {
    const file = await ipfs.get(`/file/${cid}`, {})
    return utils.decodeBinary(new Uint8Array(file), publicKey, this.myKeypair.privateKey, nonce)
  }

  async uploadFile(file: Uint8Array, publicKey: Uint8Array) {
    const formData = new FormData()
    const { binary, nonce } = utils.encodeBinary(file, publicKey, this.myKeypair.privateKey)
    formData.append('file', binary)

    const { cids } = await ipfs.post(`/file/upload`, formData, {
      'Content-Type': 'multipart/form-data'
    })
    return { cids, nonce }
  }
}
