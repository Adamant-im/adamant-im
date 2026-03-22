import { QueryStatus } from '@tanstack/vue-query'
import {
  CryptoSymbol,
  isInstantSendPossible,
  TransactionStatus,
  TransactionStatusType
} from '@/lib/constants'
import { PendingTxStore } from '@/lib/pending-transactions'
import {
  AllNodesDisabledError,
  AllNodesOfflineError,
  isAllNodesDisabledError,
  isAllNodesOfflineError,
  isNodeOfflineError,
  NodeOfflineError,
  TransactionNotFound
} from '@/lib/nodes/utils/errors'
import {
  getTxFetchInfo,
  INSTANT_SEND_INTERVAL,
  INSTANT_SEND_TIME
} from '@/lib/transactionsFetching'

export function isTransactionQueryRecoverableError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return typeof navigator !== 'undefined' && navigator.onLine === false
  }

  if (
    error instanceof NodeOfflineError ||
    error instanceof AllNodesOfflineError ||
    error instanceof AllNodesDisabledError ||
    isNodeOfflineError(error as Error) ||
    isAllNodesOfflineError(error as Error) ||
    isAllNodesDisabledError(error as Error)
  ) {
    return true
  }

  const networkError = error as {
    response?: { status?: number }
    request?: unknown
    code?: string
    name?: string
    message?: string
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true
  }

  if (networkError.code === 'ERR_CANCELED' || networkError.name === 'CanceledError') {
    return true
  }

  if (!networkError.response && networkError.request) {
    return true
  }

  const recoverableCodes = new Set([
    'ECONNABORTED',
    'ECONNREFUSED',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ENOTFOUND',
    'ERR_NETWORK',
    'ETIMEDOUT'
  ])

  if (networkError.code && recoverableCodes.has(networkError.code)) {
    return true
  }

  const statusCode = networkError.response?.status
  if (typeof statusCode === 'number' && statusCode >= 500) {
    return true
  }

  const message = (networkError.message || '').toLowerCase()

  return (
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('timeout') ||
    message.includes('offline')
  )
}

export function isTransactionQueryNotFoundError(error: unknown) {
  if (error instanceof TransactionNotFound) {
    return true
  }

  if (!error || typeof error !== 'object') {
    return false
  }

  const networkError = error as {
    response?: { status?: number }
    message?: string
  }

  if (networkError.response?.status === 404) {
    return true
  }

  const message = (networkError.message || '').toLowerCase()

  return message.includes('transaction not found')
}

export function retryFactory(crypto: CryptoSymbol, transactionId: string) {
  const txFetchInfo = getTxFetchInfo(crypto)

  return (failureCount: number, error: unknown): boolean => {
    if (isTransactionQueryRecoverableError(error)) {
      return true
    }

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
  transaction?: { status?: TransactionStatusType; timestamp?: number },
  error?: unknown
) {
  const txFetchInfo = getTxFetchInfo(crypto)

  if (
    transaction?.status === TransactionStatus.CONFIRMED ||
    transaction?.status === TransactionStatus.REJECTED
  ) {
    // Do not refetch if transaction status is considered finalized
    return false
  }

  if (queryStatus === 'error' && !isTransactionQueryRecoverableError(error)) {
    return false
  }

  if (isInstantSendPossible(crypto) && transaction?.timestamp) {
    return Date.now() - transaction.timestamp < INSTANT_SEND_TIME
      ? INSTANT_SEND_INTERVAL
      : txFetchInfo.registeredInterval
  }

  return txFetchInfo.registeredInterval
}

export function refetchOnMountFn(transaction?: { status?: TransactionStatusType }) {
  return (
    !transaction ||
    !transaction?.status ||
    transaction?.status === TransactionStatus.PENDING ||
    transaction?.status === TransactionStatus.REGISTERED
  )
}
