import type { AxiosRequestConfig } from 'axios'
import { NODE_LABELS } from '@/lib/nodes/constants'
import type { NodeInfo } from '@/types/wallets'
import { DogeIndexer } from './DogeIndexer'
import { Client } from '../abstract.client'
import { NB_BLOCKS } from './constants'
import { normalizeTransaction } from './utils'
import { NodeStatus } from './types/api/node-status'
import {
  Transaction,
  GetTransactionsParams,
  GetTransactionsResponse
} from './types/api/transaction'
import { GetUnspentsParams, UTXO } from './types/api/utxo'
import { AddressInfo } from './types/api/address'
import { EstimatedFee, GetEstimatedFeeParams } from './types/api/estimated-fee'
import { Balance } from './types/api/balance'

/**
 * Raw history reader bound to a single indexer for the whole walk it is passed to
 */
export type DogeIndexerHistorySession = {
  /** URL of the indexer serving this walk. Offsets are only valid against it */
  node: string
  /** Generation counter of the history session */
  generation: number
  get<Response = any, Params = any>(path: string, params?: Params): Promise<Response>
}

export class DogeIndexerClient extends Client<DogeIndexer> {
  constructor(endpoints: NodeInfo[] = [], minNodeVersion = '0.0.0') {
    super('doge', 'service', NODE_LABELS.DogeIndexer)
    this.nodes = endpoints.map((endpoint) => new DogeIndexer(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }

  /**
   * Performs a request to the Doge indexer.
   */
  async request<Response = any, Params = any>(
    method: 'GET' | 'POST',
    path: string,
    params?: Params,
    requestConfig?: AxiosRequestConfig<Params, Params>
  ): Promise<Response> {
    return this.requestWithRetry((node) =>
      node.request<Response, Params>(method, path, params, requestConfig)
    )
  }

  async getTransaction(transactionId: string, address: string) {
    const transaction = await this.request<Transaction>('GET', `/api/tx/${transactionId}`)

    return normalizeTransaction(transaction, address)
  }

  async getTransactions(address: string, params: GetTransactionsParams = {}) {
    const response = await this.request<GetTransactionsResponse, GetTransactionsParams>(
      'GET',
      `/api/addrs/${address}/txs`,
      params
    )
    const transactions = Array.isArray(response)
      ? response
      : response.items || response.txs || response.transactions || []

    return transactions.map((transaction) => normalizeTransaction(transaction, address))
  }

  async getUnspents(address: string, params: GetUnspentsParams = { noCache: 1 }) {
    return this.request<UTXO[], GetUnspentsParams>('GET', `/api/addr/${address}/utxo`, params)
  }

  /**
   * Must be divided by 1024 to get the fee in satoshis per byte.
   * @param params
   */
  async getEstimatedFee(params: GetEstimatedFeeParams = { nbBlocks: NB_BLOCKS }) {
    return this.request<EstimatedFee, GetEstimatedFeeParams>(
      'GET',
      '/api/utils/estimatefee',
      params
    )
  }

  async getAddress(address: string) {
    return this.request<AddressInfo>('GET', `/api/addr/${address}`)
  }

  async getBalance(address: string) {
    const balance = await this.request<Balance>('GET', `/api/addr/${address}/balance`)

    return Number(balance)
  }

  async getHeight() {
    const { info } = await this.request<NodeStatus>('GET', '/api/status')

    return info.blocks
  }

  /**
   * Runs a whole history walk against the pinned session indexer. History is paged by an
   * offset into the node's own list, and indexers order transactions sharing a
   * timestamp differently and may even list different sets, so an offset is only
   * meaningful on the node it was computed against.
   *
   * All requests within the session share this pinned node. If the node becomes unavailable,
   * session affinity is reset and fails over to an active replacement node.
   *
   * @param walk Callback receiving the scoped session bound to the selected node
   */
  async walkHistory<T>(walk: (session: DogeIndexerHistorySession) => Promise<T>): Promise<T> {
    return this.requestHistoryWithRetry((node, generation) =>
      walk(this.createSession(node, generation))
    )
  }

  private createSession(node: DogeIndexer, generation: number): DogeIndexerHistorySession {
    return {
      node: node.url,
      generation,
      get: (path, params) => node.request('GET', path, params)
    }
  }
}
