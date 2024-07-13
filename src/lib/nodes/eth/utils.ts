import Web3Eth from 'web3-eth'
import { CryptosInfo, CryptoSymbol, TransactionStatus } from '@/lib/constants'
import * as ethUtils from '@/lib/eth-utils'
import { EthTransaction, Erc20Transaction } from '@/lib/nodes/types/transaction'
import * as utils from '@/lib/eth-utils'
import Erc20 from '@/store/modules/erc20/erc20.abi.json'
import { AbiDecoder } from '@/lib/abi/abi-decoder'

const abiDecoder = new AbiDecoder(Erc20 as any)

/**
 * Normalize ETH transaction
 * @param transaction
 * @param blockTimestamp Block timestamp in seconds. Omitted if the transaction is not included in a block yet
 */
export function normalizeEthTransaction(
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
    direction: 'from', // @todo: implement direction detection
    senderId: transaction.from,
    recipientId: transaction.to!,
    amount: Number(utils.toEther(amount)),
    confirmations: 0
  }
}

export function normalizeErc20Transaction(
  transaction: Awaited<ReturnType<Web3Eth['getTransaction']>>,
  crypto: CryptoSymbol,
  blockTimestamp?: number | bigint
): Erc20Transaction {
  const gasPrice = 'gasPrice' in transaction ? transaction.gasPrice : 0
  const effectiveGasPrice = 'effectiveGasPrice' in transaction ? transaction.effectiveGasPrice : 0
  const fee = utils.calculateFee(transaction.gas, gasPrice.toString())

  let recipientId = ''
  let amount = '0'

  const decoded = abiDecoder.decodeMethod(transaction.input)
  if (decoded?.name === 'transfer') {
    decoded.params.forEach((x) => {
      if (x.name === '_to') recipientId = x.value as string
      if (x.name === '_value')
        amount = ethUtils.toFraction(x.value as string, CryptosInfo[crypto].decimals)
    })
  }

  return {
    id: transaction.hash,
    hash: transaction.hash,
    fee: Number(fee),
    status: transaction.blockNumber ? TransactionStatus.CONFIRMED : TransactionStatus.PENDING,
    time: blockTimestamp ? Number(blockTimestamp) : undefined,
    timestamp: blockTimestamp ? Number(blockTimestamp) * 1000 : undefined,
    blockNumber: transaction.blockNumber ? Number(transaction.blockNumber) : undefined,
    direction: 'from', // @todo: implement direction detection
    senderId: transaction.from,
    recipientId,
    amount: Number(amount),
    confirmations: 0,
    gasPrice: Number(gasPrice || effectiveGasPrice)
  }
}
