import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Security regression tests:
 * AttachmentApi.getFile() must reject downloads whose byte length exceeds
 * the declared file size (plus NaCl box overhead).
 * A malicious IPFS node returning an oversized payload must never reach
 * decodeBinary — the check must fire before any decryption attempt.
 */

const DECLARED_SIZE = 1024 // bytes — as written in FileAsset.size
const NACL_BOX_OVERHEAD = 32

// Build a fake ArrayBuffer of the given byte length
const makeBuffer = (byteLength: number): ArrayBuffer => new ArrayBuffer(byteLength)

const mockDownloadFile = vi.fn()
const mockDecodeBinary = vi.fn(() => new Uint8Array(8))

vi.mock('@/lib/nodes/ipfs', () => ({
  default: { downloadFile: mockDownloadFile }
}))

vi.mock('@/lib/adamant', () => ({
  default: {
    createPassphraseHash: vi.fn(() => Buffer.alloc(32)),
    makeKeypair: vi.fn(() => ({
      publicKey: Buffer.alloc(32),
      privateKey: Buffer.alloc(64)
    })),
    decodeBinary: mockDecodeBinary,
    encodeBinary: vi.fn()
  }
}))

vi.mock('@/lib/hex', () => ({ hexToBytes: vi.fn((h) => Buffer.from(h, 'hex')) }))

const { AttachmentApi } = await import('@/lib/attachment-api/index')

const api = new AttachmentApi('test passphrase')

beforeEach(() => {
  vi.clearAllMocks()
  mockDecodeBinary.mockReturnValue(new Uint8Array(8))
})

describe('AttachmentApi.getFile: download size enforcement', () => {
  it('downloads and decodes file when size is within limit', async () => {
    const exactPayload = makeBuffer(DECLARED_SIZE + NACL_BOX_OVERHEAD) // exactly at boundary
    mockDownloadFile.mockResolvedValue(exactPayload)

    await expect(api.getFile('cid1', 'nonce', 'pubkey', DECLARED_SIZE)).resolves.not.toThrow()
    expect(mockDecodeBinary).toHaveBeenCalledOnce()
  })

  it('throws before decoding when downloaded bytes exceed declared size + overhead', async () => {
    const oversizedPayload = makeBuffer(DECLARED_SIZE + NACL_BOX_OVERHEAD + 1)
    mockDownloadFile.mockResolvedValue(oversizedPayload)

    await expect(api.getFile('cid2', 'nonce', 'pubkey', DECLARED_SIZE)).rejects.toThrow(
      'Downloaded file size exceeds declared size'
    )
    // decodeBinary must NOT be called — check fires before decryption
    expect(mockDecodeBinary).not.toHaveBeenCalled()
  })

  it('skips size check when maxSize is not provided (backwards compatibility)', async () => {
    // Payload larger than DECLARED_SIZE but maxSize is undefined → no check
    const largePayload = makeBuffer(DECLARED_SIZE * 100)
    mockDownloadFile.mockResolvedValue(largePayload)

    await expect(api.getFile('cid3', 'nonce', 'pubkey')).resolves.not.toThrow()
    expect(mockDecodeBinary).toHaveBeenCalledOnce()
  })
})
