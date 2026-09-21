import type { AxiosRequestConfig } from 'axios'
import { NODE_LABELS } from '@/lib/nodes/constants'
import type { NodeInfo } from '@/types/wallets'
import { Client } from '../abstract.client'
import { BtcIndexer } from './BtcIndexer'
import { MULTIPLIER, normalizeTransaction } from './utils'
import { Transaction } from './types/api/common/transaction'
import { UTXO } from './types/api/common/unspent'
import { GetAddressParams } from './types/api/get-address/get-address-params'
import { GetAddressResult } from './types/api/get-address/get-address-result'
import { GetUnspentsParams } from './types/api/get-unspents/get-unspents-params'
import { logger } from '@/utils/devTools/logger'
import type { BtcTransaction } from '@/lib/nodes/types/transaction'

/**
 * History reader bound to a single indexer for the whole walk it is passed to
 */
export type BtcIndexerHistorySession = {
  /** URL of the indexer serving this walk. Cursors are only valid against it */
  node: string
  getTransactions(address: string, toTx?: string): Promise<BtcTransaction[]>
}

/**
 * Provides methods for calling the ADAMANT API.
 *
 * The `ApiClient` instance automatically selects an ADAMANT node to
 * send the API-requests to and switches to another node if the current one
 * is not available at the moment.
 */
export class BtcIndexerClient extends Client<BtcIndexer> {
  constructor(endpoints: NodeInfo[] = [], minNodeVersion = '0.0.0') {
    super('btc', 'service', NODE_LABELS.BtcIndexer)
    this.nodes = endpoints.map((endpoint) => new BtcIndexer(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }

  /**
   * Performs a request to the BTC indexer.
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

  /**
   * Return transaction details normalized.
   *
   * @param transactionId Transaction ID
   * @param address Owner BTC address
   */
  async getTransaction(transactionId: string, address: string) {
    const transaction = await this.request<Transaction>('GET', `/tx/${transactionId}`)

    const height = await this.getHeight().catch((err) => {
      logger.log('BtcIndexerClient', 'warn', 'BtcClient: Failed to get current height:', err)
      return undefined
    })

    return normalizeTransaction(transaction, address, height)
  }

  /**
   * Query transactions history
   *
   * @param address BTC address
   * @param toTx Until transaction ID. For pagination.
   */
  async getTransactions(address: string, toTx?: string) {
    const transactions = await this.request<Transaction[]>(
      'GET',
      this.historyEndpoint(address, toTx)
    )

    return transactions.map((transaction) => normalizeTransaction(transaction, address))
  }

  private historyEndpoint(address: string, toTx?: string) {
    return toTx ? `/address/${address}/txs/chain/${toTx}` : `/address/${address}/txs`
  }

  /**
   * Runs a whole history walk against the pinned session indexer.
   *
   * History is paged by "everything older than this transaction", and indexers
   * legitimately keep different history depths: a pruned one does not know the
   * cursor at all and answers with an empty page, which reads as the end of
   * history. Every page of one walk therefore goes to the pinned session node,
   * and if it becomes unavailable the session affinity is cleared and the walk
   * restarts on another node instead of continuing a cursor into a different dataset.
   *
   * @param walk Callback receiving the scoped session bound to the selected node
   */
  async walkHistory<T>(walk: (session: BtcIndexerHistorySession) => Promise<T>): Promise<T> {
    return this.requestHistoryWithRetry((node) => walk(this.createSession(node)))
  }

  /**
   * Confirms that the history ends where `excludedUrl` says it does. A node that
   * does not know the cursor, or keeps a shorter history, answers with a short page,
   * which alone must not latch the end of history. `probe` repeats the older-history
   * step on each other active node and resolves `true` when it has nothing more.
   */
  async confirmHistoryEnd(
    excludedUrl: string,
    probe: (session: BtcIndexerHistorySession) => Promise<boolean>
  ): Promise<boolean> {
    return this.confirmOnOtherNodes(excludedUrl, (node) => probe(this.createSession(node)))
  }

  private createSession(node: BtcIndexer): BtcIndexerHistorySession {
    return {
      node: node.url,
      getTransactions: async (address, toTx) => {
        const transactions = await node.request<Transaction[]>(
          'GET',
          this.historyEndpoint(address, toTx)
        )

        return transactions.map((transaction) => normalizeTransaction(transaction, address))
      }
    }
  }

  /**
   * Get unspent transaction outputs (UTXOs) for the specified address.
   * @param address BTC address
   */
  async getUnspents(address: string) {
    return this.request<UTXO[], GetUnspentsParams>('GET', `/address/${address}/utxo`)
  }

  async getFeeRate() {
    return this.request<Record<string, number>>('GET', '/fee-estimates')
  }

  async getHeight() {
    const height = await this.request<string>('GET', '/blocks/tip/height')

    return Number(height)
  }

  async getAddress(address: string) {
    return this.request<GetAddressResult, GetAddressParams>('GET', `/address/${address}`)
  }

  async getBalance(address: string) {
    const { chain_stats } = await this.getAddress(address)

    const balance = (chain_stats.funded_txo_sum - chain_stats.spent_txo_sum) / MULTIPLIER

    return balance
  }
}
