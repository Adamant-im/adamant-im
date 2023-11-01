import axios, { AxiosInstance } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class LskNode extends Node {
  client: AxiosInstance

  constructor(url: string) {
    super(url)

    this.client = axios.create({ baseURL: url })
    this.client.interceptors.response.use(null, (error) => {
      if (error.response && Number(error.response.status) >= 500) {
        console.error(`Request to ${url} failed.`, error)
      }
      // Lisk is spamming with 404 in console, when there is no LSK account
      // There is no way to disable 404 logging for Chrome
      if (error.response && Number(error.response.status) === 404) {
        if (
          error.response.data &&
          error.response.data.errors &&
          error.response.data.errors[0] &&
          error.response.data.errors[0].message &&
          error.response.data.errors[0].message.includes('was not found')
        ) {
          return error.response
        }
      }
      return Promise.reject(error)
    })

    void this.startHealthcheck()
  }

  protected async checkHealth() {
    const time = Date.now()
    const height = await this.client.get('/api/node/info').then((res) => res.data.data.height)

    return {
      height,
      ping: Date.now() - time
    }
  }
}
