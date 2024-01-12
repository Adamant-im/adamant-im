import { TransactionNotFound } from '@/lib/nodes/utils/errors'
import { PendingTransactionError } from './errors'
import { PendingTxStore } from './storage'

type TxFetcher = (hash: string) => Promise<unknown>

/**
 * Returns `true` if there is a pending transaction for the given crypto
 * @param crypto e.g. 'ETH' | 'LSK'
 * @param txFetcher Must throw `TransactionNotFound` error if transaction is not found. Must resolve if transaction is registered in the blockchain.
 */
async function hasPendingTransaction(crypto: string, txFetcher: TxFetcher) {
  const pendingTransaction = PendingTxStore.get(crypto)
  if (!pendingTransaction) {
    return false // there is no pending transaction
  }

  try {
    await txFetcher(pendingTransaction.hash)

    return false // if node returns success response, then it is not a pending transaction anymore
  } catch (err) {
    if (err instanceof TransactionNotFound) {
      console.debug(
        `Transaction ${pendingTransaction.hash} not registered yet in the blockchain`,
        err,
        pendingTransaction
      )

      // Transaction not yet registered in the blockchain. This means that it is still in pending state.
      return pendingTransaction
    }

    throw err
  }
}

/**
 * Asserts that there is no pending transaction for the given crypto
 *
 * @param crypto e.g. 'ETH' | 'LSK'
 * @param txFetcher Must throw `TransactionNotFound` error if transaction is not found. Must resolve if transaction is registered in the blockchain.
 * @param nonce Current nonce
 */
export async function assertNoPendingTransaction(
  crypto: string,
  txFetcher: TxFetcher,
  nonce: string | number | bigint
) {
  const pendingTransaction = await hasPendingTransaction(crypto, txFetcher)

  if (pendingTransaction) {
    console.log('currentNonce', nonce, 'pendingTransactionNonce', pendingTransaction.nonce)
    // Technically we can send the second transaction by incrementing the nonce manually
    // without waiting for the first transaction to be confirmed
    if (pendingTransaction.nonce && nonce && Number(nonce) > Number(pendingTransaction.nonce)) {
      console.log('Current nonce is higher than pendingTransaction nonce, sending the transaction')
      return
    }

    throw new PendingTransactionError(pendingTransaction)
  }
}
