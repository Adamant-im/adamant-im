import { TransactionStatus } from '@/lib/constants'
import * as utils from '@/lib/eth-utils'
import { Transaction } from './types/api/get-transactions/transaction'
import { EthTransaction } from '@/lib/nodes/types/transaction'

/**
 * PostgreSQL `query_canceled` SQLSTATE. PostgREST reports a `statement_timeout`
 * with this code and an HTTP 500, which is not a network failure and therefore
 * is not recognized as node unavailability on its own
 */
const PG_QUERY_CANCELED = '57014'

/**
 * Tells a PostgREST statement timeout from any other error. Such a node is
 * reachable but unable to serve the query, so the request has to be retried
 * on another indexer instead of failing the whole history load
 */
export function isStatementTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const data = (error as { response?: { data?: unknown } }).response?.data

  if (!data || typeof data !== 'object') return false

  const { code, message } = data as { code?: unknown; message?: unknown }

  if (code === PG_QUERY_CANCELED) return true

  return typeof message === 'string' && message.toLowerCase().includes('statement timeout')
}

/**
 * @param transaction
 * @param ownerAddress ETH address
 * @param decimals Converts satoshi to specified decimals
 */
export function normalizeTransaction(
  transaction: Transaction,
  ownerAddress: string,
  decimals: number
): EthTransaction {
  const hash = transaction.txhash.replace(/^.*x/, '0x').toLowerCase()
  const senderId = transaction.txfrom.toLowerCase()
  const recipientId = transaction.contract_to
    ? '0x' + transaction.contract_to.substr(-40)
    : transaction.txto.toLowerCase()

  const direction = transaction.txfrom.toLowerCase() === ownerAddress.toLowerCase() ? 'from' : 'to'
  const value = transaction.contract_value
    ? parseInt(transaction.contract_value, 16)
    : transaction.value

  return {
    id: hash,
    hash: hash,
    fee: Number(utils.calculateFee(transaction.gas, transaction.gasprice)),
    status: TransactionStatus.CONFIRMED,
    time: transaction.time, // block timestamp in seconds
    timestamp: transaction.time * 1000, // block timestamp in ms
    direction,
    senderId,
    recipientId,
    amount: Number(utils.toFraction(value, decimals)),
    blockNumber: transaction.block
  }
}
