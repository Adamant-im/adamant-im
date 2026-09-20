import { AxiosRequestConfig } from 'axios'
import { NODE_LABELS } from '@/lib/nodes/constants'
import type { NodeInfo } from '@/types/wallets'
import { GetTransactionsParams } from './types/client/get-transactions-params'
import { GetTransactionsRequest } from './types/api/get-transactions/get-transactions.request'
import { Endpoints } from './types/api/endpoints'
import { EthIndexer } from './EthIndexer'
import { normalizeTransaction } from './utils'
import { Transaction } from './types/api/get-transactions/transaction'
import { Client } from '../abstract.client'

/**
 * Default number of transactions to fetch when the caller does not
 * specify a limit. Keeps every `/ethtxs` query bounded.
 */
const DEFAULT_LIMIT = 25

export class EthIndexerClient extends Client<EthIndexer> {
  constructor(endpoints: NodeInfo[] = [], minNodeVersion = '0.0.0') {
    super('eth', 'service', NODE_LABELS.EthIndexer)
    this.nodes = endpoints.map((endpoint) => new EthIndexer(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }

  private async request<E extends keyof Endpoints>(
    endpoint: E,
    params?: Endpoints[E]['params'],
    axiosRequestConfig?: AxiosRequestConfig<Endpoints[E]['params'], Endpoints[E]['params']>
  ): Promise<Endpoints[E]['result']> {
    return this.requestWithRetry((node) => node.request(endpoint, params, axiosRequestConfig))
  }

  /**
   * Builds a PostgREST query for native ETH transactions where the given
   * address is the sender or the recipient and no token contract is involved
   */
  private buildNativeEthQuery(
    address: string,
    direction: 'txfrom' | 'txto',
    from?: number,
    to?: number
  ): GetTransactionsRequest {
    const filters = [`${direction}.eq.${address}`, 'contract_to.eq.']

    if (from) {
      filters.push(`time.gte.${from}`)
    }
    if (to) {
      filters.push(`time.lte.${to}`)
    }

    return {
      and: `(${filters.join(',')})`,
      order: 'time.desc'
    }
  }

  /**
   * Fetches one side (sent or received) of native ETH history.
   * The query is always bounded by `limit` so PostgREST never scans an unbounded set
   */
  private async fetchNativeEthSide(
    address: string,
    direction: 'txfrom' | 'txto',
    limit: number,
    from?: number,
    to?: number
  ): Promise<Transaction[]> {
    const requestParams = this.buildNativeEthQuery(address, direction, from, to)

    return this.request('GET /ethtxs', {
      ...requestParams,
      limit
    })
  }

  /**
   * Query transactions history
   */
  async getTransactions(params: GetTransactionsParams) {
    const { address, contract, from, to, limit, decimals } = params

    // Every query must carry an explicit limit so PostgREST never scans
    // the whole matching set (see issue #975)
    const effectiveLimit = limit ?? DEFAULT_LIMIT

    let transactions: Transaction[]

    if (contract) {
      // ERC-20 transfers: constrain by the token contract and bound by limit
      const filters = [
        `txto.eq.${contract}`,
        `or(txfrom.eq.${address},contract_to.eq.000000000000000000000000${address.replace(
          '0x',
          ''
        )})`
      ]

      if (from) {
        filters.push(`time.gte.${from}`)
      }
      if (to) {
        filters.push(`time.lte.${to}`)
      }

      transactions = await this.request('GET /ethtxs', {
        and: `(${filters.join(',')})`,
        order: 'time.desc',
        limit: effectiveLimit
      })
    } else {
      // Native ETH: run two indexed queries (sender side and recipient side),
      // each bounded by limit, then merge client-side. A single
      // `or(txfrom,txto)` + `order=time.desc` query may pick a backward
      // `time_index` scan and stall PostgREST on a large index
      const [sent, received] = await Promise.all([
        this.fetchNativeEthSide(address, 'txfrom', effectiveLimit, from, to),
        this.fetchNativeEthSide(address, 'txto', effectiveLimit, from, to)
      ])

      // Deduplicate self-transfers that appear in both sender and recipient queries
      const seen = new Set<string>()
      transactions = [...sent, ...received].filter((tx) => {
        if (seen.has(tx.txhash)) return false
        seen.add(tx.txhash)
        return true
      })
    }

    return transactions
      .sort((a, b) => b.time - a.time)
      .map((transaction) => normalizeTransaction(transaction, address, decimals))
      .slice(0, effectiveLimit)
  }
}
