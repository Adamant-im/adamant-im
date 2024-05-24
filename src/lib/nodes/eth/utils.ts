import { TransactionStatus } from '@/lib/constants'
import { EthTransaction } from '@/lib/nodes/types/transaction'
import * as utils from '@/lib/eth-utils'
import Web3Eth from 'web3-eth'

/**
 * Normalize ETH transaction
 * @param transaction
 * @param blockTimestamp Block timestamp in seconds. Omitted if the transaction is not included in a block yet
 */
export function normalizeTransaction(
  transaction: Awaited<ReturnType<Web3Eth['getTransaction']>>,
  blockTimestamp?: number | bigint
): EthTransaction {
  const gasPrice = 'gasPrice' in transaction ? transaction.gasPrice : '0'
  const fee = utils.calculateFee(transaction.gas, gasPrice.toString())
  const amount = 'value' in transaction ? transaction.value : '0'

  return {
    id: transaction.hash,
    hash: transaction.hash,
    fee: Number(fee),
    status: transaction.blockNumber ? TransactionStatus.CONFIRMED : TransactionStatus.PENDING,
    time: blockTimestamp ? Number(blockTimestamp) : undefined,
    timestamp: blockTimestamp ? Number(blockTimestamp) * 1000 : undefined,
    blockNumber: transaction.blockNumber ? Number(transaction.blockNumber) : undefined,
    direction: 'from',
    senderId: transaction.from,
    recipientId: transaction.to!,
    amount: Number(utils.toEther(amount)),
    confirmations: 0
  }
}
