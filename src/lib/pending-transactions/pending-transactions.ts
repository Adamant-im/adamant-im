import { PendingTransactionError } from './errors'
import { PendingTxStore } from './storage'

type TxFinalizeChecker = (hash: string) => Promise<boolean>

/**
 * Returns `true` if there is a pending transaction for the given crypto
 * @param crypto e.g. 'ETH' | 'LSK'
 * @param checkTransactionFinalized Must return `true` if transaction was written to blockchain.
 */
async function hasPendingTransaction(crypto: string, checkTransactionFinalized: TxFinalizeChecker) {
  const pendingTransaction = PendingTxStore.get(crypto)
  if (!pendingTransaction) {
    return false // there is no pending transaction
  }

  const isFinalized = await checkTransactionFinalized(pendingTransaction.hash)

  return isFinalized ? false : pendingTransaction
}

/**
 * Asserts that there is no pending transaction for the given crypto
 *
 * @param crypto e.g. 'ETH' | 'LSK'
 * @param checkTransactionFinalized Must return `true` if transaction was written to blockchain.
 * @param nonce Current nonce
 */
export async function assertNoPendingTransaction(
  crypto: string,
  checkTransactionFinalized: TxFinalizeChecker,
  nonce: string | number | bigint
) {
  const pendingTransaction = await hasPendingTransaction(crypto, checkTransactionFinalized)

  if (pendingTransaction) {
    // Technically we can send the second transaction by incrementing the nonce manually
    // without waiting for the first transaction to be confirmed
    if (pendingTransaction.nonce && nonce && Number(nonce) > Number(pendingTransaction.nonce)) {
      return
    }

    throw new PendingTransactionError(pendingTransaction, crypto)
  }
}
