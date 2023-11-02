import { isNodeOfflineError } from '@/lib/nodes/utils/errors'
import { AdmNode, Payload, RequestConfig } from './AdmNode'
import { Client } from '../abstract.client'

import semver from 'semver'

/**
 * Provides methods for calling the ADAMANT API.
 *
 * The `ApiClient` instance automatically selects an ADAMANT node to
 * send the API-requests to and switches to another node if the current one
 * is not available at the moment.
 */
export class AdmClient extends Client<AdmNode> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super()
    this.nodes = endpoints.map((endpoint) => new AdmNode(endpoint, minNodeVersion))
    this.minNodeVersion = minNodeVersion
    this.useFastest = false

    void this.watchNodeStatusChange()
  }

  /**
   * Performs a GET API request.
   * @param {String} url relative API url
   * @param {any} params request params (an object) or a function that accepts `ApiNode` and returns the request params
   */
  get<P extends Payload = Payload>(url: string, params: P) {
    return this.request({ method: 'get', url, payload: params })
  }

  /**
   * Performs a POST API request.
   * @param {String} url relative API url
   * @param {any} payload request payload (an object) or a function that accepts `ApiNode` and returns the request payload
   */
  post<P extends Payload = Payload>(url: string, payload: P) {
    return this.request({ method: 'post', url, payload })
  }

  /**
   * Performs an API request.
   * @param {RequestConfig} config request config
   */
  async request<P extends Payload = Payload>(config: RequestConfig<P>): Promise<any> {
    const node = this.useFastest ? this.getFastestNode() : this.getRandomNode()
    if (!node) {
      // All nodes seem to be offline: let's refresh the statuses
      this.checkHealth()
      // But there's nothing we can do right now
      return Promise.reject(new Error('No online nodes at the moment'))
    }

    return node.request(config).catch((error) => {
      if (isNodeOfflineError(error)) {
        // Initiate nodes status check
        this.checkHealth()
        // If the selected node is not available, repeat the request with another one.
        return this.request(config)
      }
      throw error
    })
  }
}
