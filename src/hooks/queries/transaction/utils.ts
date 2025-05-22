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
import {
  isAllNodesDisabledError,
  isAllNodesOfflineError,
  isNodeOfflineError
} from '@/lib/nodes/utils/errors'
import { isAxiosError } from 'axios'

const isNew = ({
  newPendingAttempts,
  newPendingInterval,
  transaction
}: {
  newPendingAttempts: number
  newPendingInterval: number
  transaction?: {
    timestamp?: number
  }
}) => {
  return (
    transaction?.timestamp &&
    Date.now() - transaction.timestamp < newPendingAttempts * newPendingInterval
  )
}

export function retryFactory(crypto: CryptoSymbol, transactionId: string) {
  const { newPendingAttempts, oldPendingAttempts, newPendingInterval } = getTxFetchInfo(crypto)

  return (failureCount: number, error: unknown): boolean => {
    if (
      isAllNodesDisabledError(error as Error) ||
      isNodeOfflineError(error as Error) ||
      isAllNodesOfflineError(error as Error) ||
      isAxiosError(error)
    ) {
      return true
    }

    const pendingTransaction = PendingTxStore.get(crypto)

    const isPendingTransaction = pendingTransaction?.id === transactionId

    const attempts =
      isPendingTransaction &&
      isNew({ newPendingAttempts, newPendingInterval, transaction: pendingTransaction })
        ? newPendingAttempts
        : oldPendingAttempts

    return failureCount + 1 < attempts
  }
}

export function retryDelayFactory(crypto: CryptoSymbol, transactionId: string) {
  const { newPendingInterval, oldPendingInterval, newPendingAttempts } = getTxFetchInfo(crypto)

  return (): number => {
    const pendingTransaction = PendingTxStore.get(crypto)

    const isPendingTransaction = pendingTransaction?.id === transactionId

    return isPendingTransaction &&
      isNew({ newPendingInterval, newPendingAttempts, transaction: pendingTransaction })
      ? newPendingInterval
      : oldPendingInterval
  }
}

export function refetchIntervalFactory(
  crypto: CryptoSymbol,
  queryStatus: QueryStatus,
  transaction?: { status: TransactionStatusType; timestamp?: number }
) {
  const { registeredInterval, newPendingInterval, newPendingAttempts } = getTxFetchInfo(crypto)

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
      : registeredInterval
  }

  return transaction?.status === TransactionStatus.PENDING &&
    isNew({ newPendingInterval, newPendingAttempts, transaction })
    ? newPendingInterval
    : registeredInterval
}

export function refetchOnMountFn(transaction?: { status: TransactionStatusType }) {
  return (
    !transaction ||
    transaction?.status === TransactionStatus.PENDING ||
    transaction?.status === TransactionStatus.REGISTERED
  )
}
