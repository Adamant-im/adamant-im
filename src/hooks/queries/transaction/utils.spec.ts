import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Cryptos, CryptosInfo, TransactionStatus } from '@/lib/constants'
import { AllNodesOfflineError, TransactionNotFound } from '@/lib/nodes/utils/errors'
import {
  getTxFetchInfo,
  INSTANT_SEND_INTERVAL,
  INSTANT_SEND_TIME
} from '@/lib/transactionsFetching'
import {
  isTransactionQueryRecoverableError,
  refetchIntervalFactory,
  refetchOnMountFn,
  retryDelayFactory,
  retryFactory
} from './utils'

const pendingGetMock = vi.fn()

vi.mock('@/lib/pending-transactions', () => ({
  PendingTxStore: {
    get: (...args: unknown[]) => pendingGetMock(...args)
  }
}))

describe('transaction query utils', () => {
  beforeEach(() => {
    vi.useRealTimers()
    pendingGetMock.mockReset()
  })

  it('uses txFetchInfo from wallet metadata for the supported crypto set', () => {
    for (const crypto of [
      Cryptos.ADM,
      Cryptos.BTC,
      Cryptos.DASH,
      Cryptos.DOGE,
      Cryptos.ETH,
      Cryptos.USDT
    ]) {
      const info = getTxFetchInfo(crypto)

      expect(info.newPendingInterval).toBeGreaterThan(0)
      expect(info.oldPendingInterval).toBeGreaterThan(0)
      expect(info.registeredInterval).toBeGreaterThan(0)
      expect(info.newPendingAttempts).toBeGreaterThan(0)
      expect(info.oldPendingAttempts).toBeGreaterThan(0)
    }
  })

  it('maps ERC-20 txFetchInfo to the ETH chain settings', () => {
    const ethTxFetchInfo = CryptosInfo[Cryptos.ETH].txFetchInfo!

    expect(getTxFetchInfo(Cryptos.USDT)).toEqual(getTxFetchInfo(Cryptos.ETH))
    expect(getTxFetchInfo(Cryptos.ETH)).toEqual({
      newPendingInterval: ethTxFetchInfo.newPendingInterval,
      oldPendingInterval: ethTxFetchInfo.oldPendingInterval,
      registeredInterval: ethTxFetchInfo.registeredInterval,
      newPendingAttempts: ethTxFetchInfo.newPendingAttempts,
      oldPendingAttempts: ethTxFetchInfo.oldPendingAttempts
    })
  })

  it('uses new pending attempts and delays for the locally pending transaction only', () => {
    pendingGetMock.mockReturnValue({
      id: 'tx-new'
    })

    const btcTxFetchInfo = CryptosInfo[Cryptos.BTC].txFetchInfo!
    const newPendingAttempts = btcTxFetchInfo.newPendingAttempts!
    const oldPendingAttempts = btcTxFetchInfo.oldPendingAttempts!

    expect(
      retryFactory(Cryptos.BTC, 'tx-new')(Math.max(newPendingAttempts - 2, 0), undefined)
    ).toBe(true)
    expect(retryFactory(Cryptos.BTC, 'tx-new')(newPendingAttempts - 1, undefined)).toBe(false)
    expect(retryFactory(Cryptos.BTC, 'tx-old')(oldPendingAttempts - 1, undefined)).toBe(false)

    expect(retryDelayFactory(Cryptos.BTC, 'tx-new')()).toBe(
      CryptosInfo[Cryptos.BTC].txFetchInfo!.newPendingInterval
    )
    expect(retryDelayFactory(Cryptos.BTC, 'tx-old')()).toBe(
      CryptosInfo[Cryptos.BTC].txFetchInfo!.oldPendingInterval
    )
  })

  it('does not spend txFetchInfo retry budget on recoverable connectivity errors', () => {
    const recoverableError = new AllNodesOfflineError('btc')

    expect(retryFactory(Cryptos.BTC, 'tx-any')(10_000, recoverableError)).toBe(true)
    expect(isTransactionQueryRecoverableError(recoverableError)).toBe(true)
  })

  it('keeps fast refetching recent Dash registered transactions while InstantSend is still possible', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-22T12:00:00.000Z'))

    expect(
      refetchIntervalFactory(Cryptos.DASH, 'success', {
        status: TransactionStatus.REGISTERED,
        timestamp: Date.now() - 5_000
      })
    ).toBe(INSTANT_SEND_INTERVAL)

    expect(
      refetchIntervalFactory(Cryptos.DASH, 'success', {
        status: TransactionStatus.REGISTERED,
        timestamp: Date.now() - INSTANT_SEND_TIME - 1
      })
    ).toBe(CryptosInfo[Cryptos.DASH].txFetchInfo!.registeredInterval)
  })

  it('stops polling only for finalized or failed transactions, not for pending and registered ones', () => {
    expect(refetchOnMountFn()).toBe(true)
    expect(refetchOnMountFn({ status: TransactionStatus.PENDING })).toBe(true)
    expect(refetchOnMountFn({ status: TransactionStatus.REGISTERED })).toBe(true)
    expect(
      refetchIntervalFactory(Cryptos.DOGE, 'success', {
        status: TransactionStatus.REJECTED
      })
    ).toBe(false)
    expect(
      refetchIntervalFactory(Cryptos.DOGE, 'success', {
        status: TransactionStatus.CONFIRMED
      })
    ).toBe(false)
  })

  it('keeps polling registered transactions after recoverable lookup errors', () => {
    expect(
      refetchIntervalFactory(
        Cryptos.BTC,
        'error',
        {
          status: TransactionStatus.REGISTERED
        },
        new AllNodesOfflineError('btc')
      )
    ).toBe(CryptosInfo[Cryptos.BTC].txFetchInfo!.registeredInterval)
  })

  it('stops polling when the lookup error definitively says the transaction does not exist', () => {
    expect(
      refetchIntervalFactory(
        Cryptos.BTC,
        'error',
        {
          status: TransactionStatus.PENDING
        },
        new TransactionNotFound('tx-id', Cryptos.BTC)
      )
    ).toBe(false)
  })
})
