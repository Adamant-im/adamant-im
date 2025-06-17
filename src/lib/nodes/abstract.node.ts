import type { NodeInfo } from '@/types/wallets/index.ts'
import { getBaseURL, getHealthCheckInterval } from './utils/getHealthcheckConfig'
import { TNodeLabel } from './constants'
import { HealthcheckInterval, HealthcheckResult, NodeKind, NodeStatus, NodeType } from './types'
import { nodesStorage } from './storage'

type HttpProtocol = 'http:' | 'https:'
type WsProtocol = 'ws:' | 'wss:'

/**
 * Protocol on host where app is running, f. e., http: or https:
 */
const appProtocol = location.protocol

export abstract class Node<C = unknown> {
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
   * Node alternative IP
   */
  altIp?: string
  /**
   * Node base URL
   */
  url: string
  /**
   * Node protocol, like http: or https:
   */
  protocol: HttpProtocol
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
  wsProtocol: WsProtocol = 'wss:'
  /**
   * If Socket port like :36668 needed for connection
   */
  wsPortNeeded = false
  hasSupportedProtocol = true

  // Healthcheck related params
  /**
   * Indicates whether a node with alternative IP is available
   */
  altIpAvailable = false
  /**
   * Indicates whether a node with main URL is available
   */
  mainUrlAvailable = true
  /**
   * Indicates whether node is available.
   */
  online = true
  /**
   * Indicates whether prefer a node with alternative IP or not
   */
  preferAltIp = false
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
  minNodeVersion = ''
  /**
   * Current block height
   */
  height = 0
  /**
   * Will be updated after `GET /api/node/status`
   */
  socketSupport = false

  type: NodeType
  kind: NodeKind
  label: TNodeLabel

  onStatusChangeCallback?: (nodeStatus: ReturnType<typeof this.getStatus>) => void

  timer?: NodeJS.Timeout
  healthCheckInterval: HealthcheckInterval = 'normal'
  client: C
  clientAlt: C
  healthcheckInProgress = false

  constructor(
    endpoint: NodeInfo,
    type: NodeType,
    kind: NodeKind,
    label: TNodeLabel,
    version = '',
    minNodeVersion = ''
  ) {
    const { alt_ip, url } = endpoint

    this.altIp = alt_ip
    this.url = url
    this.type = type
    this.label = label
    this.kind = kind
    this.protocol = new URL(url).protocol as HttpProtocol
    this.port = new URL(url).port
    this.hostname = new URL(url).hostname
    this.minNodeVersion = minNodeVersion
    this.version = version
    this.hasSupportedProtocol = !(this.protocol === 'http:' && appProtocol === 'https:')
    this.active = nodesStorage.isActive(url)

    this.client = this.buildClient()
    this.clientAlt = this?.buildClientAlt?.()

    if (this.active) {
      void this.fetchNodeVersion()
    }
  }

  async startHealthcheck() {
    clearInterval(this.timer)

    if (this.active && !this.healthcheckInProgress) {
      try {
        this.healthcheckInProgress = true
        const health = await this.checkHealth()

        this.height = health.height
        this.ping = health.ping
        this.online = true

        if (!this.preferAltIp) {
          console.info(
            `Attempt to use domain ${this.url} performed successfully, using domain by default.`
          )
          this.mainUrlAvailable = true
        } else {
          console.info(
            `There was a failed attempt to use domain ${this.url}, using IP ${this.altIp} by default.`
          )
        }
      } catch {
        if (!this.preferAltIp && this.mainUrlAvailable) {
          console.info(
            `There was a failed attempt to use domain ${this.url}, trying to use IP ${this.altIp} in the next attempt.`
          )
          this.mainUrlAvailable = false
          this.preferAltIp = true
        } else {
          console.info(
            `There was failed attempts to use domain ${this.url} and IP ${this.altIp}, assume node is offline.`
          )
          this.online = false
          this.preferAltIp = false
        }
      } finally {
        this.healthcheckInProgress = false
      }

      this.fireStatusChange()
    }

    this.timer = setTimeout(
      () => this.startHealthcheck(),
      getHealthCheckInterval(this.label, this.online ? this.healthCheckInterval : 'crucial')
    )
  }

  updateHealthCheckInterval(interval: HealthcheckInterval) {
    this.healthCheckInterval = interval
    this.startHealthcheck().catch(console.error)
  }

  private fireStatusChange() {
    this.onStatusChangeCallback?.(this.getStatus())
  }

  onStatusChange(callback: typeof this.onStatusChangeCallback) {
    this.onStatusChangeCallback = callback
  }

  getStatus() {
    return {
      alt_ip: this.altIp,
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
      hasMinNodeVersion: this.hasMinNodeVersion(),
      displayVersion: this.displayVersion(),
      hasSupportedProtocol: this.hasSupportedProtocol,
      socketSupport: this.socketSupport,
      height: this.height,
      status: this.getNodeStatus(),
      type: this.type,
      label: this.label,
      formattedHeight: this.formatHeight(this.height)
    }
  }

  getNodeStatus(): NodeStatus {
    if (!this.active) {
      return 'disabled'
    }

    if (!this.online) {
      return 'offline'
    }

    if (!this.hasMinNodeVersion() || !this.hasSupportedProtocol) {
      return 'unsupported_version'
    }

    if (this.outOfSync) {
      return 'sync'
    }

    return 'online'
  }

  hasMinNodeVersion() {
    // if not provided then it doesn't require min version check
    if (!this.minNodeVersion) {
      return true
    }

    return this.version >= this.minNodeVersion
  }

  protected abstract checkHealth(): Promise<HealthcheckResult>
  protected abstract buildClient(): C
  protected abstract buildClientAlt(): C

  /**
   * Enables/disables a node.
   */
  toggleNode(active: boolean) {
    const baseURL = getBaseURL(this)

    this.active = active

    nodesStorage.saveActive(baseURL, active)

    return this.getStatus()
  }

  displayVersion() {
    return this.version ? `v${this.version}` : ''
  }

  formatHeight(height: number) {
    return height.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // This method is not abstract because Not all nodes need version checking (For example: indexers) or some nodes receive version information from healthcheck requests.
  // Therefore, it is overridden only in the case when a separate request is needed to obtain the version.
  protected fetchNodeVersion() {
    return Promise.resolve()
  }
}

export type NodeStatusResult = ReturnType<Node['getStatus']>
