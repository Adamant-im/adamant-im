import utils from '@/lib/adamant'
import { GetNodeStatusResponseDto } from '@/lib/schema/client'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

/**
 * Protocol on host where app is running, f. e., http: or https:
 */
const appProtocol = location.protocol

/**
 * Custom error to indicate that the endpoint is not available
 */
class NodeOfflineError extends Error {
  code = 'NODE_OFFLINE'

  constructor() {
    super('Node is offline')

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NodeOfflineError)
    }
  }
}

type FetchNodeStatusResult = {
  online: boolean
  socketSupport: boolean
  version?: string
  height?: number
  ping?: number
  wsPort?: string
}

type GetNodeStatusResult = {
  url: string
  port: string
  hostname: string
  protocol: string
  wsProtocol: 'ws:' | 'wss:'
  wsPort: string
  wsPortNeeded: boolean
  online: boolean
  ping: number
  version: string
  active: boolean
  outOfSync: boolean
  hasMinNodeVersion: boolean
  hasSupportedProtocol: boolean
  socketSupport: boolean
}

export type Payload =
  | Record<string, any>
  | {
      (ctx: AdmNode): Record<string, any>
    }
export type RequestConfig<P extends Payload> = {
  url: string
  method?: string
  payload?: P
}

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class AdmNode {
  /**
   * Indicates whether node is active (i.e. user allows the application
   * to interact with this node).
   */
  active = true

  /**
   * Indicates whether node is out of sync (i.e. its block height is
   * either too big or too small compared to the other nodes)
   */
  outOfSync = false

  /**
   * Default `wsPort`. Will be updated after `GET /api/node/status`
   */
  wsPort = '36668'

  /**
   * Node base URL
   */
  baseUrl: string
  /**
   * Node protocol, like http: or https:
   */
  protocol: string
  /**
   * Node port like 36666 for http nodes (default)
   */
  port: string
  /**
   * Node hostname like bid.adamant.im or 23.226.231.225
   */
  hostname: string
  /**
   * WebSocket protocol
   */
  wsProtocol: 'ws:' | 'wss:'
  /**
   * If Socket port like :36668 needed for connection
   */
  wsPortNeeded: boolean
  hasSupportedProtocol: boolean

  // Healthcheck related params
  /**
   * Indicates whether node is available.
   */
  online = false
  /**
   * Node ping estimation
   */
  ping = Infinity
  /**
   * Delta between local time and the node time
   */
  timeDelta = 0
  /**
   * Node API version.
   */
  version = ''
  /**
   * Minimal required Node API version.
   */
  minNodeVersion: string
  /**
   * Current block height
   */
  height = 0
  /**
   * Will be updated after `GET /api/node/status`
   */
  socketSupport = false

  client: AxiosInstance

  constructor(baseUrl: string, minNodeVersion = '0.0.0') {
    this.baseUrl = baseUrl
    this.protocol = new URL(baseUrl).protocol
    this.port = new URL(baseUrl).port
    this.hostname = new URL(baseUrl).hostname
    this.wsPort = '36668' // default wsPort
    this.wsProtocol = this.protocol === 'https:' ? 'wss:' : 'ws:'
    this.wsPortNeeded = this.wsProtocol === 'ws:' && !this.hostname.includes('.onion')
    this.hasSupportedProtocol = !(this.protocol === 'http:' && appProtocol === 'https:')
    this.minNodeVersion = minNodeVersion

    this.client = axios.create({
      baseURL: this.baseUrl
    })
  }

  get url() {
    return this.baseUrl
  }

  /**
   * Performs an API request.
   *
   * The `payload` of the `cfg` can be either an object or a function that
   * accepts `ApiNode` as a first argument and returns an object.
   */
  request<P extends Payload = Payload>(cfg: RequestConfig<P>) {
    const { url, method = 'get', payload } = cfg

    const config: AxiosRequestConfig = {
      url,
      method: method.toLowerCase(),
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
   * Initiates node status update: version, ping, online/offline.
   * @returns {PromiseLike}
   */
  async updateStatus() {
    try {
      const status = await this.fetchNodeStatus()

      if (status.version) {
        this.version = status.version
      }
      if (status.height) {
        this.height = status.height
      }
      if (status.ping) {
        this.ping = status.ping
      }
      if (status.wsPort) {
        this.wsPort = status.wsPort
      }
      this.online = status.online
      this.socketSupport = status.socketSupport
    } catch (err) {
      this.online = false
      this.socketSupport = false
    }
  }

  /**
   * Fetch node version, block height and ping.
   * @returns {Promise<{version: string, height: number, ping: number}>}
   */
  private async fetchNodeStatus(): Promise<FetchNodeStatusResult> {
    if (!this.hasSupportedProtocol) {
      return Promise.reject({
        online: false,
        socketSupport: false
      })
    }

    const time = Date.now()
    const response: GetNodeStatusResponseDto = await this.request({ url: '/api/node/status' })
    if (response.success) {
      return {
        online: true,
        version: response.version.version,
        height: Number(response.network.height),
        ping: Date.now() - time,
        socketSupport: response.wsClient ? response.wsClient.enabled : false,
        wsPort: response.wsClient ? String(response.wsClient.port) : undefined
      }
    }

    throw new Error('Request to /api/node/status was unsuccessful')
  }

  getNodeStatus(): GetNodeStatusResult {
    return {
      url: this.url,
      port: this.port,
      hostname: this.hostname,
      protocol: this.protocol,
      wsProtocol: this.wsProtocol,
      wsPort: this.wsPort,
      wsPortNeeded: this.wsPortNeeded,
      online: this.online,
      ping: this.ping,
      version: this.version,
      active: this.active,
      outOfSync: this.outOfSync,
      hasMinNodeVersion: this.version >= this.minNodeVersion,
      hasSupportedProtocol: this.hasSupportedProtocol,
      socketSupport: this.socketSupport
    }
  }
}
