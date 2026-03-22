import { beforeEach, describe, expect, it, vi } from 'vitest'

const { admClientMock, storeMock } = vi.hoisted(() => ({
  admClientMock: {
    post: vi.fn()
  },
  storeMock: {
    state: {
      address: ''
    },
    getters: {
      publicKey: () => undefined
    },
    commit: vi.fn()
  }
}))

vi.mock('@/lib/nodes/adm', () => ({
  default: admClientMock
}))

vi.mock('@/lib/idb/crypto', () => ({
  encryptPassword: vi.fn()
}))

vi.mock('@/lib/idb/state', () => ({
  restoreState: vi.fn()
}))

vi.mock('@/i18n', () => ({
  i18n: {
    global: {
      t: (key) => key
    }
  }
}))

vi.mock('@/store', () => ({
  default: storeMock
}))

vi.mock('@/utils/devTools/logger', () => ({
  logger: {
    log: vi.fn()
  }
}))

vi.mock('sodium-browserify-tweetnacl', async () => {
  const nacl = await import('tweetnacl/nacl-fast')

  return {
    default: {
      crypto_sign_seed_keypair(seed) {
        const keyPair = nacl.sign.keyPair.fromSeed(
          seed instanceof Uint8Array ? seed : new Uint8Array(seed)
        )

        return {
          publicKey: Buffer.from(keyPair.publicKey),
          secretKey: Buffer.from(keyPair.secretKey)
        }
      },
      crypto_sign_detached(message, secretKey) {
        return Buffer.from(
          nacl.sign.detached(
            message instanceof Uint8Array ? message : new Uint8Array(message),
            secretKey instanceof Uint8Array ? secretKey : new Uint8Array(secretKey)
          )
        )
      }
    }
  }
})

import { unlock, sendTokens } from './index'
import { Transactions } from '@/lib/constants'

const TEST_ACCOUNT_PASSPHRASE =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
const ADM_RECIPIENT = 'U12345678901234567890'

describe('offline ADM send builder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds and signs an ADM send transaction with the test account before submission', async () => {
    let capturedTransaction

    admClientMock.post.mockImplementation(async (_url, payloadFactory) => {
      const payload = payloadFactory({ timeDelta: 0 })
      capturedTransaction = payload.transaction

      return {
        success: true,
        transactionId: 'adm-test-transaction-id'
      }
    })

    const senderAddress = unlock(TEST_ACCOUNT_PASSPHRASE)
    const result = await sendTokens(ADM_RECIPIENT, 1.25)

    expect(result).toEqual({
      success: true,
      transactionId: 'adm-test-transaction-id'
    })
    expect(capturedTransaction).toMatchObject({
      type: Transactions.SEND,
      senderId: senderAddress,
      recipientId: ADM_RECIPIENT,
      amount: 125000000
    })
    expect(capturedTransaction.senderPublicKey).toMatch(/^[0-9a-f]+$/)
    expect(capturedTransaction.signature).toMatch(/^[0-9a-f]+$/)
    expect(capturedTransaction.timestamp).toBeTypeOf('number')
  })
})
