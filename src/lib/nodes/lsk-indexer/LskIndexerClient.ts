import { LSK_TOKEN_ID } from '@/lib/lisk'
import { AxiosRequestConfig } from 'axios'
import { normalizeTransaction } from './utils'
import { TransactionParams } from './types/api/transactions/transaction-params'
import { Endpoints } from './types/api/endpoints'
import { LskIndexer } from './LskIndexer'
import { Client } from '../abstract.client'

export class LskIndexerClient extends Client<LskIndexer> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super('lsk')
    this.nodes = endpoints.map((endpoint) => new LskIndexer(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }

  private async request<E extends keyof Endpoints>(
    endpoint: E,
    params?: Endpoints[E]['params'],
    axiosRequestConfig?: AxiosRequestConfig
  ): Promise<Endpoints[E]['result']> {
    const node = this.useFastest ? this.getFastestNode() : this.getRandomNode()
    if (!node) {
      // All nodes seem to be offline: let's refresh the statuses
      this.checkHealth()
      // But there's nothing we can do right now
      throw new Error('No online nodes at the moment')
    }

    return node.request(endpoint, params, axiosRequestConfig)
  }

  /**
   * Query transactions history
   *
   * @param params Query params
   * @param address Owner address
   */
  async getTransactions(params: TransactionParams, address: string) {
    const { data: transactions } = await this.request('GET /transactions', {
      ...params,
      moduleCommand: 'token:transfer'
    })

    return transactions.map((transaction) => normalizeTransaction(transaction, address))
  }

  /**
   * Returns a single transaction by ID
   *
   * @param transactionID
   * @param address
   */
  async getTransaction(transactionID: string, address: string) {
    const { data: transactions } = await this.request('GET /transactions', {
      transactionID
    })

    const transaction = transactions[0]

    if (!transaction) {
      throw new Error(`LskIndexer: Transaction ID:${transactionID} not found`)
    }

    return normalizeTransaction(transaction, address)
  }

  /**
   * Checks if an account exists
   * @param address
   * @param axiosRequestConfig
   */
  async checkAccountExists(address: string, axiosRequestConfig?: AxiosRequestConfig) {
    const { data } = await this.request(
      'GET /token/account/exists',
      {
        address,
        tokenID: LSK_TOKEN_ID
      },
      axiosRequestConfig
    )

    return data.isExists
  }
}
