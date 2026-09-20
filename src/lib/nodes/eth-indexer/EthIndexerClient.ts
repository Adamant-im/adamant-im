import { AxiosRequestConfig } from 'axios'
import { NODE_LABELS } from '@/lib/nodes/constants'
import type { NodeInfo } from '@/types/wallets'
import { GetTransactionsParams } from './types/client/get-transactions-params'
import { GetTimestampGroupParams } from './types/client/get-timestamp-group-params'
import { GetTransactionsRequest } from './types/api/get-transactions/get-transactions.request'
import { Endpoints } from './types/api/endpoints'
import { EthIndexer } from './EthIndexer'
import { isStatementTimeoutError, normalizeTransaction } from './utils'
import { Transaction } from './types/api/get-transactions/transaction'
import { Client } from '../abstract.client'
import { NodeOfflineError } from '../utils/errors'

/**
 * Default number of transactions to fetch when the caller does not
 * specify a limit. Keeps every `/ethtxs` query bounded.
 */
const DEFAULT_LIMIT = 25

type TimeOrder = 'time.asc' | 'time.desc'

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
    return this.requestWithRetry(async (node) => {
      try {
        return await node.request(endpoint, params, axiosRequestConfig)
      } catch (error) {
        // A statement timeout arrives as HTTP 500, which `requestWithRetry` does
        // not treat as node unavailability. This indexer cannot serve the query,
        // so report it as offline and let the retry pick another one
        if (isStatementTimeoutError(error)) {
          throw new NodeOfflineError()
        }

        throw error
      }
    })
  }

  /**
   * Address part of a `/ethtxs` filter: either ERC-20 transfers of one contract
   * or native transfers where the address is the sender or the recipient
   */
  private buildAddressFilters(address: string, contract?: string): string[] {
    if (contract) {
      return [
        `txto.eq.${contract}`,
        `or(txfrom.eq.${address},contract_to.eq.000000000000000000000000${address.replace(
          '0x',
          ''
        )})`
      ]
    }

    return ['contract_to.eq.', `or(txfrom.eq.${address},txto.eq.${address})`]
  }

  /**
   * Builds a PostgREST query for native ETH transactions where the given
   * address is the sender or the recipient and no token contract is involved
   */
  private buildNativeEthQuery(
    address: string,
    direction: 'txfrom' | 'txto',
    order: TimeOrder,
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
      order
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
    order: TimeOrder,
    from?: number,
    to?: number
  ): Promise<Transaction[]> {
    const requestParams = this.buildNativeEthQuery(address, direction, order, from, to)

    return this.request('GET /ethtxs', {
      ...requestParams,
      limit
    })
  }

  /**
   * Query transactions history
   */
  async getTransactions(params: GetTransactionsParams) {
    const { address, contract, from, to, limit, decimals, order = 'time.desc' } = params

    // Every query must carry an explicit limit so PostgREST never scans
    // the whole matching set (see issue #975)
    const effectiveLimit = limit ?? DEFAULT_LIMIT
    const ascending = order === 'time.asc'

    let transactions: Transaction[]

    if (contract) {
      // ERC-20 transfers: constrain by the token contract and bound by limit
      const filters = this.buildAddressFilters(address, contract)

      if (from) {
        filters.push(`time.gte.${from}`)
      }
      if (to) {
        filters.push(`time.lte.${to}`)
      }

      transactions = await this.request('GET /ethtxs', {
        and: `(${filters.join(',')})`,
        order,
        limit: effectiveLimit
      })
    } else {
      // Native ETH: run two indexed queries (sender side and recipient side),
      // each bounded by limit, then merge client-side. A single
      // `or(txfrom,txto)` + `order=time.desc` query may pick a backward
      // `time_index` scan and stall PostgREST on a large index
      const [sent, received] = await Promise.all([
        this.fetchNativeEthSide(address, 'txfrom', effectiveLimit, order, from, to),
        this.fetchNativeEthSide(address, 'txto', effectiveLimit, order, from, to)
      ])

      // Deduplicate self-transfers that appear in both sender and recipient queries
      const seen = new Set<string>()
      transactions = [...sent, ...received].filter((tx) => {
        if (seen.has(tx.txhash)) return false
        seen.add(tx.txhash)
        return true
      })
    }

    // Slice in the requested direction: for `time.asc` the caller expects the
    // oldest `limit` records above the boundary, not the newest ones
    return transactions
      .sort((a, b) => (ascending ? a.time - b.time : b.time - a.time))
      .slice(0, effectiveLimit)
      .map((transaction) => normalizeTransaction(transaction, address, decimals))
  }

  /**
   * Reads one page of the transactions that share an exact block timestamp.
   *
   * `time` is a block timestamp and is not unique, so such a group may not fit
   * into a single page and cannot be walked with a `time` cursor at all. The
   * order is made total by `txhash`, which makes `offset` paging over the group
   * deterministic, and the caller pages until a short page ends the group.
   *
   * Unlike the general native-ETH query this one is not split per direction:
   * an `offset` into one side is not an `offset` into the merged result. It is
   * safe to keep as a single query because the exact `time` equality restricts
   * the scan to one block instead of the whole `time` index.
   */
  async getTimestampGroup(params: GetTimestampGroupParams) {
    const { address, contract, time, limit = DEFAULT_LIMIT, offset = 0, decimals } = params

    const filters = [
      ...this.buildAddressFilters(address, contract),
      `time.gte.${time}`,
      `time.lte.${time}`
    ]

    const transactions = await this.request('GET /ethtxs', {
      and: `(${filters.join(',')})`,
      order: 'time.asc,txhash.asc',
      limit,
      offset
    })

    return transactions.map((transaction) => normalizeTransaction(transaction, address, decimals))
  }
}
