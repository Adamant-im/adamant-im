import utils from '@/lib/adamant'
import { NodeOfflineError } from '@/lib/nodes/utils/errors'
import { GetNodeStatusResponseDto } from '@/lib/schema/client'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'

type FetchNodeInfoResult = {
  socketSupport: boolean
  version: string
  height: number
}

export type Payload =
  | Record<string, any>
  | {
      (ctx: IpfsNode): Record<string, any>
    }
export type RequestConfig<P extends Payload> = {
  url: string
  headers?: Record<string, string>
  method?: string
  payload?: P
}

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class IpfsNode extends Node<AxiosInstance> {
  constructor(url: string, minNodeVersion = '0.0.0') {
    super(url, 'ipfs', 'node', NODE_LABELS.IpfsNode, '', minNodeVersion)
  }

  protected buildClient(): AxiosInstance {
    return axios.create({
      baseURL: this.url,
      timeout: 60 * 10 * 1000
    })
  }

  /**
   * Performs an API request.
   *
   * The `payload` of the `cfg` can be either an object or a function that
   * accepts `ApiNode` as a first argument and returns an object.
   */
  request<P extends Payload = Payload, R = any>(cfg: RequestConfig<P>): Promise<R> {
    const { url, headers, method = 'get', payload } = cfg

    const config: AxiosRequestConfig = {
      url,
      method: method.toLowerCase(),
      headers,
      responseType: 'arraybuffer',
      [method === 'get' ? 'params' : 'data']:
        typeof payload === 'function' ? payload(this) : payload
    }

    return this.client.request(config).then(
      (response) => {
        const body = response.data
        // Refresh time delta on each request
        if (body && isFinite(body.nodeTimestamp)) {
          this.timeDelta = utils.epochTime() - body.nodeTimestamp
        }

        return body
      },
      (error) => {
        // According to https://github.com/axios/axios#handling-errors this means, that request was sent,
        // but server could not respond.
        if (!error.response && error.request) {
          this.online = false
          throw new NodeOfflineError()
        }
        throw error
      }
    )
  }

  /**
   * Fetch node version, block height and ping.
   * @returns {Promise<{version: string, height: number, ping: number}>}
   */
  private async fetchNodeInfo(): Promise<FetchNodeInfoResult> {
    const { success, version, network, wsClient } = await this.request<
      Payload,
      GetNodeStatusResponseDto
    >({ url: '/api/node/status' })

    if (success) {
      const readableVersion = version.version
      const height = Number(network.height)
      const socketSupport = wsClient ? wsClient.enabled : false

      this.version = readableVersion
      this.height = height
      this.socketSupport = socketSupport

      return {
        version: readableVersion,
        height,
        socketSupport
      }
    }

    throw new Error('Request to /api/node/status was unsuccessful')
  }

  protected async checkHealth() {
    const time = Date.now()
    const { height } = await this.fetchNodeInfo()

    return {
      height,
      ping: Date.now() - time
    }
  }
}
