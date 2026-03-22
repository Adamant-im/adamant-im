import { CryptoSymbol, TransactionStatus, TransactionStatusType } from '@/lib/constants'

const finalStatuses = new Set<TransactionStatusType>([
  TransactionStatus.CONFIRMED,
  TransactionStatus.REJECTED,
  TransactionStatus.INVALID
])

const checkedTransactions = new Set<string>()
let sessionAddress = ''

function normalizeAddress(address?: string) {
  return address?.trim() || ''
}

export function syncTransactionStatusSession(address?: string) {
  const normalizedAddress = normalizeAddress(address)

  if (!normalizedAddress || sessionAddress !== normalizedAddress) {
    checkedTransactions.clear()
  }

  sessionAddress = normalizedAddress
}

export function makeTransactionStatusSessionKey(
  address: string | undefined,
  crypto: CryptoSymbol,
  transactionId: string | undefined
) {
  const normalizedAddress = normalizeAddress(address)

  if (!normalizedAddress || !transactionId) {
    return ''
  }

  return `${normalizedAddress}:${crypto}:${transactionId}`
}

export function rememberTransactionFinalStatus(key: string, status?: TransactionStatusType) {
  if (!key || !status || !finalStatuses.has(status)) {
    return
  }

  checkedTransactions.add(key)
}

export function hasTransactionFinalStatusInSession(key: string, status?: TransactionStatusType) {
  return !!key && !!status && finalStatuses.has(status) && checkedTransactions.has(key)
}

export function resetTransactionStatusSessionCache() {
  checkedTransactions.clear()
  sessionAddress = ''
}
