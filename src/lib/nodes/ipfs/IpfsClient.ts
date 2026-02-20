import { AxiosProgressEvent } from 'axios'
import { NODE_LABELS } from '@/lib/nodes/constants'
import type { NodeInfo } from '@/types/wallets'
import { IpfsNode, Payload, RequestConfig } from './IpfsNode'
import { Client } from '../abstract.client'

/**
 * Provides methods for calling the ADAMANT API.
 *
 * The `ApiClient` instance automatically selects an ADAMANT node to
 * send the API-requests to and switches to another node if the current one
 * is not available at the moment.
 */
export class IpfsClient extends Client<IpfsNode> {
  constructor(endpoints: NodeInfo[] = [], minNodeVersion = '0.0.0') {
    super('ipfs', 'service', NODE_LABELS.IpfsNode)
    this.nodes = endpoints.map((endpoint) => new IpfsNode(endpoint, minNodeVersion))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }

  async downloadFile(cid: string) {
    return this.request({
      method: 'get',
      url: `api/file/${cid}`,
      responseType: 'arraybuffer'
    })
  }

  async upload(
    payload: FormData,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
    signal?: AbortSignal
  ) {
    return this.request({
      method: 'post',
      url: '/api/file/upload',
      payload,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress,
      signal
    })
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
   * @param {Record<string, string>} headers request headers
   */
  post<P extends Payload = Payload>(url: string, payload: P, headers: Record<string, string>) {
    return this.request({ method: 'post', url, payload, headers })
  }

  /**
   * Performs an API request.
   * @param {RequestConfig} config request config
   */
  async request<P extends Payload = Payload, R = any>(config: RequestConfig<P>): Promise<R> {
    return this.requestWithRetry((node) => node.request(config))
  }
}
