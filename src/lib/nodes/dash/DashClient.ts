import { AxiosRequestConfig } from 'axios'
import { NODE_LABELS } from '@/lib/nodes/constants'
import type { NodeInfo } from '@/types/wallets'
import { DashNode } from './DashNode'
import { Client } from '../abstract.client'
import { normalizeTransaction } from './utils'
import { RpcRequest } from './types/api/common'
import { UTXO } from './types/api/utxo'
import { Balance } from './types/api/balance'
import { Transaction } from './types/api/transaction'
import { TransactionNotFound } from '../utils/errors'

function isDashTransactionNotFoundError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const messageCandidates = [
    error instanceof Error ? error.message : '',
    (error as { response?: { data?: { error?: { message?: string }; message?: string } } }).response
      ?.data?.error?.message,
    (error as { response?: { data?: { error?: { message?: string }; message?: string } } }).response
      ?.data?.message
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase())

  return messageCandidates.some(
    (message) =>
      message.includes('no such mempool or blockchain transaction') ||
      message.includes('transaction not found')
  )
}

export class DashClient extends Client<DashNode> {
  constructor(endpoints: NodeInfo[] = [], minNodeVersion = '0.0.0') {
    super('dash', 'node', NODE_LABELS.DashNode)
    this.nodes = endpoints.map((endpoint) => new DashNode(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }

  /**
   * Performs an RPC request to the Dash node.
   */
  async invoke<Result = any, Request extends RpcRequest = RpcRequest>(
    params: Request,
    requestConfig?: AxiosRequestConfig
  ) {
    return this.requestWithRetry((node) => node.invoke<Result, Request>(params, requestConfig))
  }

  /**
   * Performs many RPC requests to the Dash node.
   */
  async invokeMany<Result = any, Request extends RpcRequest = RpcRequest>(
    params: Request[],
    requestConfig?: AxiosRequestConfig
  ) {
    return this.requestWithRetry((node) => node.invokeMany<Result, Request>(params, requestConfig))
  }

  async getTransaction(transactionId: string, address: string) {
    let transaction: Transaction

    try {
      transaction = await this.invoke<Transaction>({
        method: 'getrawtransaction',
        params: [transactionId, true]
      })
    } catch (error) {
      if (isDashTransactionNotFoundError(error)) {
        throw new TransactionNotFound(transactionId, this.type)
      }

      throw error
    }

    return normalizeTransaction(transaction, address)
  }

  async getTransactionHex(transactionId: string) {
    let transaction: string

    try {
      transaction = await this.invoke<string>({
        method: 'getrawtransaction',
        params: [transactionId, false]
      })
    } catch (error) {
      if (isDashTransactionNotFoundError(error)) {
        throw new TransactionNotFound(transactionId, this.type)
      }

      throw error
    }

    return transaction
  }

  async getTransactionsIds(address: string) {
    return this.invoke<string[]>({
      method: 'getaddresstxids',
      params: [address]
    })
  }

  async getTransactions(address: string) {
    const txIds = await this.getTransactionsIds(address)

    const rpcCalls = txIds.map((txId) => ({
      method: 'getrawtransaction',
      params: [txId, true]
    }))

    const results = await this.invokeMany<Transaction>(rpcCalls)

    const transactions = results
      .filter((x) => !x.error && x.result)
      .map((x) => x.result) as Transaction[]

    return transactions.map((transaction) => normalizeTransaction(transaction, address))
  }

  async getUnspents(address: string) {
    const unspents = await this.invoke<UTXO[]>({
      method: 'getaddressutxos',
      params: [address]
    })

    return unspents
  }

  async getBalance(address: string) {
    const result = await this.invoke<Balance>({
      method: 'getaddressbalance',
      params: [address]
    })

    return Number(result.balance)
  }

  async getHeight() {
    const result = await this.invoke<number>({
      method: 'getblockcount'
    })

    return result
  }
}
