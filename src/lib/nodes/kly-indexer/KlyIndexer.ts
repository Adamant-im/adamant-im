import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { Endpoints } from './types/api/endpoints'

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class KlyIndexer extends Node<AxiosInstance> {
  constructor(url: string) {
    super(url, 'kly', 'service', NODE_LABELS.KlyIndexer)
  }

  protected buildClient(): AxiosInstance {
    return axios.create({ baseURL: `${this.url}/api/v3` })
  }

  /**
   * Performs a request to the Klayr service.
   *
   * @docs https://klayr.xyz/documentation/api/lisk-service-http.html
   */
  async request<E extends keyof Endpoints>(
    endpoint: E,
    params?: Endpoints[E]['params'],
    requestConfig?: AxiosRequestConfig
  ): Promise<Endpoints[E]['result']> {
    const [method, path] = endpoint.split(' ')

    return this.client
      .request({
        ...requestConfig,
        url: path,
        method,
        params: method === 'GET' ? params : undefined,
        data: method === 'POST' ? params : undefined
      })
      .then((res) => res.data)
  }

  private async fetchServiceInfo(): Promise<{ height: number }> {
    const { data } = await this.request('GET /index/status')
    this.height = data.numBlocksIndexed

    return {
      height: data.numBlocksIndexed
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
