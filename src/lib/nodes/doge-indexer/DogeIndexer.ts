import { createBtcLikeClient } from '../utils/createBtcLikeClient'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { getBaseURL } from '@/lib/nodes/utils/getHealthcheckConfig'
import type { NodeInfo } from '@/types/wallets'

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class DogeIndexer extends Node<AxiosInstance> {
  constructor(endpoint: NodeInfo) {
    super(endpoint, 'doge', 'service', NODE_LABELS.DogeIndexer)
  }

  protected buildClient(): AxiosInstance {
    const baseURL = getBaseURL(this)

    return createBtcLikeClient(baseURL)
  }

  protected async checkHealth() {
    const time = Date.now()
    const baseURL = getBaseURL(this)

    const height = await this.client
      .get('/api/status', {
        baseURL
      })
      .then((res) => res.data.info.blocks)

    return {
      height,
      ping: Date.now() - time
    }
  }

  /**
   * Performs a request to the Doge Indexer.
   */
  async request<Response = any, Params = any>(
    method: 'GET' | 'POST',
    path: string,
    params?: Params,
    requestConfig?: AxiosRequestConfig
  ): Promise<Response> {
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
}
