import { QueryStatus } from '@tanstack/vue-query'
import {
  CryptoSymbol,
  isInstantSendPossible,
  TransactionStatus,
  TransactionStatusType
} from '@/lib/constants'
import { PendingTxStore } from '@/lib/pending-transactions'
import {
  getTxFetchInfo,
  INSTANT_SEND_INTERVAL,
  INSTANT_SEND_TIME
} from '@/lib/transactionsFetching'

export function retryFactory(crypto: CryptoSymbol, transactionId: string) {
  const txFetchInfo = getTxFetchInfo(crypto)

  return (failureCount: number): boolean => {
    const pendingTransaction = PendingTxStore.get(crypto)
    const isPendingTransaction = pendingTransaction?.id === transactionId

    const attempts = isPendingTransaction
      ? txFetchInfo.newPendingAttempts
      : txFetchInfo.oldPendingAttempts

    return failureCount + 1 < attempts
  }
}

export function retryDelayFactory(crypto: CryptoSymbol, transactionId: string) {
  const txFetchInfo = getTxFetchInfo(crypto)

  return (): number => {
    const pendingTransaction = PendingTxStore.get(crypto)
    const isPendingTransaction = pendingTransaction?.id === transactionId

    const delay = isPendingTransaction
      ? txFetchInfo.newPendingInterval
      : txFetchInfo.oldPendingInterval

    return delay
  }
}

export function refetchIntervalFactory(
  crypto: CryptoSymbol,
  queryStatus: QueryStatus,
  transaction?: { status: TransactionStatusType; timestamp?: number }
) {
  const txFetchInfo = getTxFetchInfo(crypto)

  if (
    queryStatus === 'error' ||
    transaction?.status === TransactionStatus.CONFIRMED ||
    transaction?.status === TransactionStatus.REJECTED
  ) {
    // Do not refetch if transaction status is considered finalized
    return false
  }

  if (isInstantSendPossible(crypto) && transaction?.timestamp) {
    return Date.now() - transaction.timestamp < INSTANT_SEND_TIME
      ? INSTANT_SEND_INTERVAL
      : txFetchInfo.registeredInterval
  }

  return txFetchInfo.registeredInterval
}

export function refetchOnMountFn(transaction?: { status: TransactionStatusType }) {
  return (
    !transaction ||
    transaction?.status === TransactionStatus.PENDING ||
    transaction?.status === TransactionStatus.REGISTERED
  )
}
