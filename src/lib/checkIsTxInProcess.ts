import { CryptosInfo, CryptoSymbol } from '@/lib/constants'
import { getFromSessionStorage, setToSessionStorage } from '@/lib/sessionStorage'
import { DEFAULT_TX_FETCH_ATTEMPTS, DEFAULT_TX_FETCH_INTERVAL } from '@/lib/transactionsFetching'

const STORAGE_KEY = 'TRANSACTIONS_IN_PROCESS'

type StateItem = { expiration: number; nonce?: number | string }
type State = Partial<Record<CryptoSymbol, StateItem>>

const getTransactionInProcess = (coin: CryptoSymbol) => {
  const state = getFromSessionStorage<string, State>(STORAGE_KEY, {})

  return state[coin]
}

const setTransactionInProcess = (coin: CryptoSymbol, value: StateItem): void => {
  const state = getFromSessionStorage<string, State>(STORAGE_KEY, {})
  state[coin] = value

  setToSessionStorage(STORAGE_KEY, state)
}

/**
 * Check if there is a transaction in process for the given `coin` and `nonce`.
 * If there is no transaction in process, set it.
 * @param coin
 * @param nonce
 */
export function checkIsTxInProcess(coin: CryptoSymbol, nonce: number | string): boolean {
  const fetchInfo = CryptosInfo[coin].txFetchInfo
  const pendingAttempts = fetchInfo?.newPendingAttempts || DEFAULT_TX_FETCH_ATTEMPTS
  const pendingInterval = fetchInfo?.newPendingInterval || DEFAULT_TX_FETCH_INTERVAL
  const TX_LOCK_TIME = pendingAttempts * pendingInterval

  const currentTimestamp = Date.now()
  const estimatedExpiration = currentTimestamp + TX_LOCK_TIME

  const currentTransactionInProcess = getTransactionInProcess(coin)

  // Compare `nonce` with a fallback to expiration time
  if (
    !currentTransactionInProcess ||
    currentTransactionInProcess.nonce !== nonce.toString() ||
    currentTimestamp > currentTransactionInProcess.expiration
  ) {
    setTransactionInProcess(coin, {
      expiration: estimatedExpiration,
      nonce: nonce.toString()
    })

    return false
  }

  return true
}
