import { CryptosInfo } from '@/lib/constants'
import {
  getFromSessionStorage,
  removeFromSessionStorage,
  setToSessionStorage
} from '@/lib/sessionStorage.ts'
import { isEmpty } from 'lodash'

type CoinSymbols = keyof typeof CryptosInfo
type Expiration = number
type Nonce = number | string | undefined
type TransactionInProcess = { expiration: Expiration; nonce: Nonce }
const STORAGE_KEY = 'transactionsInProcess'

type TransactionsInProcess = Record<CoinSymbols, TransactionInProcess>

const getTransactionInProcess = (coin: CoinSymbols): TransactionInProcess => {
  const transactionsInProcess = getFromSessionStorage(
    STORAGE_KEY,
    {}
  ) as unknown as TransactionsInProcess
  return transactionsInProcess[coin]
}

const initTransactionsInProcess = (): void => {
  if (!(STORAGE_KEY in sessionStorage)) {
    setToSessionStorage(STORAGE_KEY, {})
  }
}

export const removeTransactionInProcess = (coin: CoinSymbols): void => {
  removeFromSessionStorage(STORAGE_KEY, coin)
}

const setTransactionInProcess = (coin: CoinSymbols, value: TransactionInProcess): void => {
  const transactionsInProcess = getFromSessionStorage(
    STORAGE_KEY,
    {}
  ) as unknown as TransactionsInProcess

  transactionsInProcess[coin] = value
  setToSessionStorage(STORAGE_KEY, transactionsInProcess)
}

export function checkIsTxInProcess(
  coin: CoinSymbols,
  nonce: number | string | null = null
): boolean {
  type FetchInfo = {
    newPendingAttempts: number
    newPendingInterval: number
  }

  const fetchInfo = (CryptosInfo[coin] as { txFetchInfo?: FetchInfo }).txFetchInfo
  const pendingAttempts = fetchInfo?.newPendingAttempts || 20
  const pendingInterval = fetchInfo?.newPendingInterval || 5000
  const TX_LOCK_TIME = pendingAttempts * pendingInterval

  const currentTimestamp = Date.now()
  const estimatedExpiration = currentTimestamp + TX_LOCK_TIME

  initTransactionsInProcess()

  const currentTransactionInProcess = getTransactionInProcess(coin)

  if (isEmpty(currentTransactionInProcess)) {
    const transactionInProcess = {
      expiration: estimatedExpiration,
      nonce: nonce?.toString()
    }

    setTransactionInProcess(coin, transactionInProcess)

    return false
  }

  return (
    currentTimestamp < currentTransactionInProcess.expiration ||
    nonce?.toString() === currentTransactionInProcess?.nonce
  )
}
