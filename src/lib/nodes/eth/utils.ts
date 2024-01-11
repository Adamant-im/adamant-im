import { TransactionStatus } from '@/lib/constants'
import { EthTransaction } from '@/lib/nodes/types/transaction'
import * as utils from '@/lib/eth-utils'
import Web3Eth from 'web3-eth'

/**
 * Normalize ETH transaction
 * @param transaction
 */
export function normalizeTransaction(
  transaction: Awaited<ReturnType<Web3Eth['getTransaction']>>
): EthTransaction {
  const gasPrice = 'gasPrice' in transaction ? transaction.gasPrice : '0'
  const fee = utils.calculateFee(transaction.gas, gasPrice.toString())

  const amount = 'value' in transaction ? transaction.value : '0'

  return {
    id: transaction.hash,
    hash: transaction.hash,
    fee: Number(fee),
    status: transaction.blockNumber ? TransactionStatus.CONFIRMED : TransactionStatus.PENDING,
    timestamp: Number(transaction.blockNumber), // @todo where is timestamp?
    blockNumber: Number(transaction.blockNumber),
    direction: 'from',
    senderId: transaction.from,
    recipientId: transaction.to!,
    amount: Number(utils.toEther(amount)),
    confirmations: 0
  }
}
