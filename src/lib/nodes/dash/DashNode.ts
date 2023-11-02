import axios, { AxiosInstance } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class DashNode extends Node {
  client: AxiosInstance

  constructor(url: string) {
    super(url)

    this.client = axios.create({ baseURL: url })
    this.client.interceptors.response.use(null, (error) => {
      if (error.response && Number(error.response.status) >= 500) {
        console.error('Request failed', error)
      }
      return Promise.reject(error)
    })

    void this.startHealthcheck()
  }

  protected async checkHealth() {
    const time = Date.now()
    const height = await this.client
      .post('/', {
        method: 'getblockchaininfo'
      })
      .then((res) => res.data.result.blocks)

    return {
      height,
      ping: Date.now() - time
    }
  }
}