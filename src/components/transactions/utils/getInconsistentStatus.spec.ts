import { describe, test, expect } from 'vitest'
import {
  getInconsistentStatus,
  TransactionInconsistentReason
} from '@/components/transactions/utils/getInconsistentStatus'
import type { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import type { CoinTransaction } from '@/lib/nodes/types/transaction'

const SENDER_CRYPTO_ADDRESS = 'klycufr5yusb5uphgbg8accfkka7tpe3x9zv872tq'
const RECIPIENT_CRYPTO_ADDRESS = 'klyfan97j6phfdc3odtoorfabxdqtdymah55wnkk9'

const createCoinTransaction = (params: Partial<CoinTransaction> = {}): CoinTransaction => ({
  id: params.id ?? '8f0a862a170e517070656945a90986c293304f85e15a70c843a6549619deefd6',
  hash: params.hash ?? '8f0a862a170e517070656945a90986c293304f85e15a70c843a6549619deefd6',
  fee: params.fee ?? 0.00165,
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
  message: params.message ?? 'Send KLY with comment',
  height: params.height ?? 41168104,
  asset: params.asset ?? {
    type: 'kly_transaction',
    amount: '1',
    hash: '8f0a862a170e517070656945a90986c293304f85e15a70c843a6549619deefd6',
    comments: 'Send KLY with comment'
  },
  hash: params.hash ?? '8f0a862a170e517070656945a90986c293304f85e15a70c843a6549619deefd6',
  type: params.type ?? 'KLY'
})

describe('getInconsistentStatus', () => {
  describe('NO_SENDER_CRYPTO_ADDRESS', () => {
    test('should pass the validation when the sender has a crypto address', () => {
      const coinTransaction = createCoinTransaction()
      const admTransaction = createAdmTransaction()

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe('')
    })

    test('should return NO_SENDER_CRYPTO_ADDRESS when the cannot retrieve the crypto address from KVS', () => {
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
    test('should pass the validation when the recipient has a crypto address', () => {
      const coinTransaction = createCoinTransaction()
      const admTransaction = createAdmTransaction()

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe('')
    })

    test('should return NO_RECIPIENT_CRYPTO_ADDRESS when the cannot retrieve the crypto address from KVS', () => {
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
    test('should return SENDER_CRYPTO_ADDRESS_MISMATCH when the sender crypto addresses do not match', () => {
      const coinTransaction = createCoinTransaction({
        senderId: 'different_sender_crypto_address'
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
    test('should return RECIPIENT_CRYPTO_ADDRESS_MISMATCH when the recipient crypto addresses do not match', () => {
      const coinTransaction = createCoinTransaction({
        recipientId: 'different_recipient_crypto_address'
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

  describe('WORNG_TX_HASH', () => {
    test('should pass the validation when the transaction hashes are the same', () => {
      const coinTransaction = createCoinTransaction({ hash: 'af08' })
      const admTransaction = createAdmTransaction({ hash: 'af08' })

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe('')
    })

    test('should return WRONG_TX_HASH when the transaction hashes do not match', () => {
      const coinTransaction = createCoinTransaction({})
      const admTransaction = createAdmTransaction({
        hash: 'different_hash'
      })

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe(TransactionInconsistentReason.WRONG_TX_HASH)
    })
  })

  describe('WRONG_AMOUNT', () => {
    test('should pass the validation when amount is the same', () => {
      const coinTransaction = createCoinTransaction({ amount: 1 })
      const admTransaction = createAdmTransaction({ amount: 1 })

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe('')
    })

    test('should return WRONG_AMOUNT when the amounts are different', () => {
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
    test('should pass the validation when the timestamps are the same', () => {
      const coinTransaction = createCoinTransaction({ timestamp: 1719667495000 })
      const admTransaction = createAdmTransaction({ timestamp: 1719667495000 })

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe('')
    })

    test('should pass the validation when the timestamps are near equal', () => {
      const coinTransaction = createCoinTransaction({ timestamp: 1719667495000 })
      const admTransaction = createAdmTransaction({ timestamp: 1719667495000 - 59000 }) // for KLY the acceptable difference is 60000 ms

      expect(
        getInconsistentStatus(coinTransaction, admTransaction, {
          senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
          recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
        })
      ).toBe('')
    })

    test('should return WRONG_TIMESTAMP when the timestamps are different', () => {
      expect(
        getInconsistentStatus(
          createCoinTransaction({ timestamp: 1719667495000 }),
          createAdmTransaction({ timestamp: 1719667495000 - 60001 }), // for KLY the acceptable difference is 60000 ms
          {
            senderCryptoAddress: SENDER_CRYPTO_ADDRESS,
            recipientCryptoAddress: RECIPIENT_CRYPTO_ADDRESS
          }
        )
      ).toBe(TransactionInconsistentReason.WRONG_TIMESTAMP)
    })
  })
})
