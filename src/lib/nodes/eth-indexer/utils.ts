import { TransactionStatus } from '@/lib/constants'
import * as utils from '@/lib/eth-utils'
import { Transaction } from './types/api/get-transactions/transaction'
import { EthTransaction } from '@/lib/nodes/types/transaction'

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
