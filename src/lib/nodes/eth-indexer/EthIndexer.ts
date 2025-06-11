import { Endpoints } from './types/api/endpoints'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { getBaseURL } from '@/lib/nodes/utils/getHealthcheckConfig'
import type { NodeInfo } from '@/types/wallets'

/**
 * ETH Indexer API
 * https://github.com/Adamant-im/ETH-transactions-storage
 */
export class EthIndexer extends Node<AxiosInstance> {
  constructor(endpoint: NodeInfo) {
    super(endpoint, 'eth', 'service', NODE_LABELS.EthIndexer)
  }

  protected buildClient(): AxiosInstance {
    const baseURL = getBaseURL(this)

    return axios.create({ baseURL })
  }

  /**
   * Performs a request to the ETH Indexer.
   * The indexer uses PostgREST.
   */
  async request<E extends keyof Endpoints>(
    endpoint: E,
    params?: Endpoints[E]['params'],
    requestConfig?: AxiosRequestConfig
  ): Promise<Endpoints[E]['result']> {
    const [method, path] = endpoint.split(' ')
    const baseURL = getBaseURL(this)

    return this.client
      .request({
        ...requestConfig,
        baseURL,
        url: path,
        method,
        params: method === 'GET' ? params : undefined,
        data: method === 'POST' ? params : undefined
      })
      .then((res) => res.data)
  }

  private async fetchServiceInfo(): Promise<{ height: number }> {
    const [{ max, version }] = await this.request('GET /max_block')
    this.height = max
    this.version = version

    return {
      height: this.height
    }
  }

  protected async checkHealth() {
    const time = Date.now()
    const { height } = await this.fetchServiceInfo()

    return {
      height,
      ping: Date.now() - time
    }
  }
}
