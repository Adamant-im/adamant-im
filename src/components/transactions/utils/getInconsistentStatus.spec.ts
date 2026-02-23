import { describe, test, expect } from 'vitest'
import {
  getInconsistentStatus,
  TransactionInconsistentReason
} from '@/components/transactions/utils/getInconsistentStatus'
import type { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import type { CoinTransaction } from '@/lib/nodes/types/transaction'

const SENDER_CRYPTO_ADDRESS = '0x1111111111111111111111111111111111111111'
const RECIPIENT_CRYPTO_ADDRESS = '0x2222222222222222222222222222222222222222'

const createCoinTransaction = (params: Partial<CoinTransaction> = {}): CoinTransaction => ({
  id: params.id ?? '0x8f0a862a170e517070656945a90986c293304f85e15a70c843a6549619deefd6',
  hash: params.hash ?? '0x8f0a862a170e517070656945a90986c293304f85e15a70c843a6549619deefd6',
  fee: params.fee ?? 0.00042,
  status: params.status ?? 'CONFIRMED',
  timestamp: params.timestamp ?? 1719667495000,
  direction: params.direction ?? 'to',
  senderId: params.senderId ?? SENDER_CRYPTO_ADDRESS,
  recipientId: params.recipientId ?? RECIPIENT_CRYPTO_ADDRESS,
  amount: params.amount ?? 1
})

const createAdmTransaction = (
  params: Partial<NormalizedChatMessageTransaction> = {}
): NormalizedChatMessageTransaction => ({
  id: params.id ?? '734166840995178668',
  senderId: params.senderId ?? 'U3716604363012166999',
  recipientId: params.recipientId ?? 'U9203183357885757380',
  admTimestamp: params.admTimestamp ?? 215295893,
  timestamp: params.timestamp ?? 1719667493000,
  confirmations: params.confirmations ?? 489051,
  status: params.status ?? 'PENDING',
  i18n: params.i18n ?? false,
  amount: params.amount ?? 1,
  message: params.message ?? 'Send ETH with comment',
  height: params.height ?? 41168104,
  asset: params.asset ?? {
    type: 'eth_transaction',
    amount: '1',
    hash: '0x8f0a862a170e517070656945a90986c293304f85e15a70c843a6549619deefd6',
    comments: 'Send ETH with comment'
  },
  hash: params.hash ?? '0x8f0a862a170e517070656945a90986c293304f85e15a70c843a6549619deefd6',
  type: params.type ?? 'ETH'
})

describe('getInconsistentStatus', () => {
  describe('NO_SENDER_CRYPTO_ADDRESS', () => {
    test('should pass validation when sender crypto address exists', () => {
      const coinTransaction = createCoinTransaction()
      const admTransaction = createAdmTransaction()

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe('')
    })

    test('should return NO_SENDER_CRYPTO_ADDRESS when sender address is absent', () => {
      const coinTransaction = createCoinTransaction()
      const admTransaction = createAdmTransaction()

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: undefined,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe(TransactionInconsistentReason.NO_SENDER_CRYPTO_ADDRESS)
    })
  })

  describe('NO_RECIPIENT_CRYPTO_ADDRESS', () => {
    test('should pass validation when recipient crypto address exists', () => {
      const coinTransaction = createCoinTransaction()
      const admTransaction = createAdmTransaction()

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe('')
    })

    test('should return NO_RECIPIENT_CRYPTO_ADDRESS when recipient address is absent', () => {
      const coinTransaction = createCoinTransaction()
      const admTransaction = createAdmTransaction()

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: undefined
        })
      ).toBe(TransactionInconsistentReason.NO_RECIPIENT_CRYPTO_ADDRESS)
    })
  })

  describe('SENDER_CRYPTO_ADDRESS_MISMATCH', () => {
    test('should return SENDER_CRYPTO_ADDRESS_MISMATCH when sender addresses differ', () => {
      const coinTransaction = createCoinTransaction({
        senderId: '0x3333333333333333333333333333333333333333'
      })
      const admTransaction = createAdmTransaction()

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe(TransactionInconsistentReason.SENDER_CRYPTO_ADDRESS_MISMATCH)
    })
  })

  describe('RECIPIENT_CRYPTO_ADDRESS_MISMATCH', () => {
    test('should return RECIPIENT_CRYPTO_ADDRESS_MISMATCH when recipient addresses differ', () => {
      const coinTransaction = createCoinTransaction({
        recipientId: '0x4444444444444444444444444444444444444444'
      })
      const admTransaction = createAdmTransaction()

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe(TransactionInconsistentReason.RECIPIENT_CRYPTO_ADDRESS_MISMATCH)
    })
  })

  describe('WRONG_TX_HASH', () => {
    test('should pass validation when hashes are equal', () => {
      const coinTransaction = createCoinTransaction({ hash: '0xaf08' })
      const admTransaction = createAdmTransaction({ hash: '0xaf08' })

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe('')
    })

    test('should return WRONG_TX_HASH when hashes differ', () => {
      const coinTransaction = createCoinTransaction()
      const admTransaction = createAdmTransaction({ hash: '0xdifferent_hash' })

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe(TransactionInconsistentReason.WRONG_TX_HASH)
    })
  })

  describe('WRONG_AMOUNT', () => {
    test('should pass validation when amounts match', () => {
      const coinTransaction = createCoinTransaction({ amount: 1 })
      const admTransaction = createAdmTransaction({ amount: 1 })

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe('')
    })

    test('should return WRONG_AMOUNT when amounts differ', () => {
      const coinTransaction = createCoinTransaction({ amount: 1 })
      const admTransaction = createAdmTransaction({ amount: 2 })

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe(TransactionInconsistentReason.WRONG_AMOUNT)
    })
  })

  describe('WRONG_TIMESTAMP', () => {
    test('should pass validation when timestamps are equal', () => {
      const coinTransaction = createCoinTransaction({ timestamp: 1719667495000 })
      const admTransaction = createAdmTransaction({ timestamp: 1719667495000 })

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe('')
    })

    test('should pass validation when timestamps are within ETH tolerance', () => {
      const coinTransaction = createCoinTransaction({ timestamp: 1719667495000 })
      const admTransaction = createAdmTransaction({ timestamp: 1719667495000 - 1199999 }) // ETH tolerance is 1200000 ms

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe('')
    })

    test('should return WRONG_TIMESTAMP when timestamps are outside ETH tolerance', () => {
      expect(
        getInconsistentStatus(
          createCoinTransaction({ timestamp: 1719667495000 }),
          createAdmTransaction({ timestamp: 1719667495000 - 1200001 }), // ETH tolerance is 1200000 ms
          {
            senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
            recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
          }
        )
      ).toBe(TransactionInconsistentReason.WRONG_TIMESTAMP)
    })
  })
})
