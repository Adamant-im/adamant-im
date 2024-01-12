import { PendingTransaction } from './types'
import { TypedStorage } from '@/lib/typed-storage'

type PendingTransactionsState = {
  [coin: string]: PendingTransaction
}

const PENDING_TRANSACTION_STORAGE_KEY = 'PENDING_TRANSACTIONS'

const storage = new TypedStorage(
  PENDING_TRANSACTION_STORAGE_KEY,
  {} as PendingTransactionsState,
  window.sessionStorage
)

export const PendingTxStore = {
  get(coin: string): PendingTransaction | null {
    const state = storage.getItem()
    const transaction = state[coin]

    return transaction || null
  },
  save(coin: string, transaction: PendingTransaction) {
    const state = storage.getItem()
    state[coin] = transaction

    storage.setItem(state)
  },
  remove(coin: string) {
    const state = storage.getItem()
    delete state[coin]

    storage.setItem(state)
  },
  clear() {
    storage.removeItem()
  }
}
