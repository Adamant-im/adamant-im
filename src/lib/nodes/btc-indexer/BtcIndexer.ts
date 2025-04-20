import { createBtcLikeClient } from '../utils/createBtcLikeClient'
import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class BtcIndexer extends Node<AxiosInstance> {
  constructor(endpoint: { alt_ip?: string; url: string }) {
    super(endpoint, 'btc', 'service', NODE_LABELS.BtcIndexer)
  }

  protected buildClient(): AxiosInstance {
    return createBtcLikeClient(this.url)
  }

  protected async checkHealth() {
    const time = Date.now()
    const blockNumber = await this.client.get('/blocks/tip/height').then((res) => {
      return Number(res.data) || 0
    })

    return {
      height: Number(blockNumber),
      ping: Date.now() - time
    }
  }

  /**
   * Performs a request to the Bitcoin indexer.
   */
  async request<Response = any, Params = any>(
    method: 'GET' | 'POST',
    path: string,
    params?: Params,
    requestConfig?: AxiosRequestConfig
  ): Promise<Response> {
    return this.client
      .request({
        ...requestConfig,
        baseURL: this.preferAltIp ? this.alt_ip : this.url,
        url: path,
        method,
        params: method === 'GET' ? params : undefined,
        data: method === 'POST' ? params : undefined
      })
      .then((res) => res.data)
  }
}
