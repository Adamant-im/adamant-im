import { isNodeOfflineError } from '@/lib/nodes/utils/errors'
import { GetHeightResponseDto } from '@/lib/schema/client'
import { AdmNode, Payload, RequestConfig } from './AdmNode'
import { Client } from '../abstract.client'

const CHECK_ONLINE_NODE_INTERVAL = 10000

/**
 * Provides methods for calling the ADAMANT API.
 *
 * The `ApiClient` instance automatically selects an ADAMANT node to
 * send the API-requests to and switches to another node if the current one
 * is not available at the moment.
 */
export class AdmClient extends Client<AdmNode> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super('adm')
    this.nodes = endpoints.map((endpoint) => new AdmNode(endpoint, minNodeVersion))
    this.minNodeVersion = minNodeVersion

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
  async request<P extends Payload = Payload, R = any>(config: RequestConfig<P>): Promise<R> {
    const node = await this.fetchAvailableNode()

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

  async fetchAvailableNode() {
    const node = this.useFastest ? this.getFastestNode() : this.getRandomNode()
    if (node) {
      return node
    }

    return await new Promise<AdmNode>((resolve) => {
      const ticker = setInterval(() => {
        let node
        try {
          node = this.useFastest ? this.getFastestNode() : this.getRandomNode()
          if (node) {
            clearInterval(ticker)
            resolve(node)
          }
        } catch (e) {
          console.error(e)
        }
      }, CHECK_ONLINE_NODE_INTERVAL)
    })
  }

  async getHeight() {
    const result = await this.request<Payload, GetHeightResponseDto>({
      method: 'get',
      url: '/api/blocks/getHeight'
    })

    return result.height
  }
}
