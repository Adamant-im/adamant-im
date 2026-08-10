import { describe, expect, it, vi, beforeEach } from 'vitest'

import { NACL_BOX_OVERHEAD, UPLOAD_MAX_FILE_SIZE } from '@/lib/constants'

const downloadFile = vi.fn()
const post = vi.fn()

vi.mock('@/lib/nodes/ipfs', () => ({
  default: {
    downloadFile: (...args: unknown[]) => downloadFile(...args),
    post: (...args: unknown[]) => post(...args)
  }
}))

vi.mock('@/lib/adamant', () => ({
  default: {
    createPassphraseHash: () => new Uint8Array(32),
    makeKeypair: () => ({ publicKey: new Uint8Array(32), privateKey: new Uint8Array(64) }),
    decodeBinary: () => new Uint8Array([1, 2, 3]),
    encodeBinary: () => ({ binary: new Uint8Array([0, 127, 128, 255]), nonce: 'nonce' })
  }
}))

const { AttachmentApi } = await import('../index')

const api = new AttachmentApi('passphrase')

beforeEach(() => {
  downloadFile.mockReset()
  downloadFile.mockResolvedValue(new ArrayBuffer(8))
  post.mockReset()
  post.mockResolvedValue({ cids: ['cid'] })
})

describe('AttachmentApi.uploadFile encrypted payload', () => {
  it('uploads encrypted bytes as a binary blob without string coercion', async () => {
    await expect(api.uploadFile(new Uint8Array([1, 2, 3]), 'ab'.repeat(32))).resolves.toEqual({
      cids: ['cid'],
      nonce: 'nonce'
    })

    const [path, formData] = post.mock.calls[0]
    const encryptedFile = formData.get('file')

    expect(path).toBe('api/file/upload')
    expect(encryptedFile).toBeInstanceOf(Blob)
    expect(encryptedFile.type).toBe('application/octet-stream')
    expect(new Uint8Array(await encryptedFile.arrayBuffer())).toEqual(
      new Uint8Array([0, 127, 128, 255])
    )
  })
})

/**
 * The bound has to reach the transport. Plumbing it into `IpfsClient` while the call site still
 * passed nothing left the option permanently `undefined` — the cap existed only as a check on a
 * response that had already been buffered in full.
 */
describe('AttachmentApi.getFile download bound', () => {
  it('passes the declared size to the transport', async () => {
    await api.getFile('cid', 'nonce', 'ab'.repeat(32), 1024)

    expect(downloadFile).toHaveBeenCalledWith('cid', 1024 + NACL_BOX_OVERHEAD)
  })

  it('falls back to the global upload limit when nothing is declared', async () => {
    await api.getFile('cid', 'nonce', 'ab'.repeat(32))

    expect(downloadFile).toHaveBeenCalledWith('cid', UPLOAD_MAX_FILE_SIZE + NACL_BOX_OVERHEAD)
  })

  it('never trusts a declared size larger than the global limit', async () => {
    await api.getFile('cid', 'nonce', 'ab'.repeat(32), UPLOAD_MAX_FILE_SIZE * 1000)

    expect(downloadFile).toHaveBeenCalledWith('cid', UPLOAD_MAX_FILE_SIZE + NACL_BOX_OVERHEAD)
  })

  it('computes the bound before the request, not after it', async () => {
    downloadFile.mockImplementation((_cid: string, limit: number) => {
      expect(limit, 'the limit must be known by the time the request is made').toBeGreaterThan(0)

      return Promise.resolve(new ArrayBuffer(8))
    })

    await api.getFile('cid', 'nonce', 'ab'.repeat(32), 512)

    expect(downloadFile).toHaveBeenCalledTimes(1)
  })

  it('keeps rejecting an oversized response as a backstop', async () => {
    downloadFile.mockResolvedValue(new ArrayBuffer(4096))

    await expect(api.getFile('cid', 'nonce', 'ab'.repeat(32), 16)).rejects.toThrow(
      /exceeds the allowed limit/
    )
  })
})
