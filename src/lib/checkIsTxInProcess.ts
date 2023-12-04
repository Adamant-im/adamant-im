import { CryptosInfo, CryptoSymbol } from '@/lib/constants'
import {
  getFromSessionStorage,
  removeFromSessionStorage,
  setToSessionStorage
} from '@/lib/sessionStorage'

const STORAGE_KEY = 'TRANSACTIONS_IN_PROCESS'

type StateItem = { expiration: number; nonce?: number | string }
type State = Partial<Record<CryptoSymbol, StateItem>>

const getTransactionInProcess = (coin: CryptoSymbol) => {
  const state = getFromSessionStorage<string, State>(STORAGE_KEY, {})

  return state[coin]
}

export const removeTransactionInProcess = (coin: CryptoSymbol): void => {
  removeFromSessionStorage(STORAGE_KEY, coin)
}

const setTransactionInProcess = (coin: CryptoSymbol, value: StateItem): void => {
  const state = getFromSessionStorage<string, State>(STORAGE_KEY, {})
  state[coin] = value

  setToSessionStorage(STORAGE_KEY, state)
}

export function checkIsTxInProcess(coin: CryptoSymbol, nonce?: number | string): boolean {
  const fetchInfo = CryptosInfo[coin].txFetchInfo
  const pendingAttempts = fetchInfo?.newPendingAttempts || 20
  const pendingInterval = fetchInfo?.newPendingInterval || 5000
  const TX_LOCK_TIME = pendingAttempts * pendingInterval

  const currentTimestamp = Date.now()
  const estimatedExpiration = currentTimestamp + TX_LOCK_TIME

  const currentTransactionInProcess = getTransactionInProcess(coin)

  if (!currentTransactionInProcess) {
    setTransactionInProcess(coin, {
      expiration: estimatedExpiration,
      nonce: nonce?.toString()
    })

    return false
  }

  return (
    currentTimestamp < currentTransactionInProcess.expiration ||
    nonce?.toString() === currentTransactionInProcess?.nonce
  )
}
