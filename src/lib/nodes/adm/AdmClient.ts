import {
  CreateNewChatMessageResponseDto,
  GetHeightResponseDto,
  RegisterChatMessageTransaction
} from '@/lib/schema/client'
import { NODE_LABELS } from '@/lib/nodes/constants'
import type { NodeInfo } from '@/types/wallets'
import { AdmNode, Payload, RequestConfig } from './AdmNode'
import { Client } from '../abstract.client'

/**
 * Provides methods for calling the ADAMANT API.
 *
 * The `ApiClient` instance automatically selects an ADAMANT node to
 * send the API-requests to and switches to another node if the current one
 * is not available at the moment.
 */
export class AdmClient extends Client<AdmNode> {
  constructor(endpoints: NodeInfo[] = [], minNodeVersion = '0.0.0') {
    super('adm', 'node', NODE_LABELS.AdmNode)
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
    return this.requestWithRetry((node) => node.request(config))
  }

  async getHeight() {
    const result = await this.request<Payload, GetHeightResponseDto>({
      method: 'get',
      url: '/api/blocks/getHeight'
    })

    return result.height
  }

  async sendChatTransaction(
    transaction: RegisterChatMessageTransaction
  ): Promise<CreateNewChatMessageResponseDto> {
    return this.post('/api/chats/process', () => ({ transaction }))
  }

  /**
   * Returns the URL of an active node that is different from `excludeUrl`.
   * Used for cross-node public key verification.
   * Returns `null` when no alternative node is available.
   */
  getAlternativeNodeUrl(excludeUrl: string): string | null {
    const availableNodes = this.nodes.filter(
      (node) => this.isActiveNode(node) && node.url !== excludeUrl
    )
    if (availableNodes.length === 0) return null
    const node = this.useFastest
      ? this.getFastestNode(availableNodes)
      : this.getRandomNode(availableNodes)
    return node?.url ?? null
  }
}
