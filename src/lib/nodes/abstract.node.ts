import { getHealthCheckInterval } from './utils/getHealthcheckConfig'
import { TNodeLabel } from './constants'
import { HealthcheckInterval, NodeKind, NodeStatus, NodeType } from './types'
import { nodesStorage } from './storage'

type HealthcheckResult = {
  height: number
  ping: number
}

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
   * Indicates whether node is available.
   */
  online = true
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

  constructor(
    url: string,
    type: NodeType,
    kind: NodeKind,
    label: TNodeLabel,
    version = '',
    minNodeVersion = ''
  ) {
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

    if (this.active) {
      void this.fetchNodeVersion()
    }

    void this.startHealthcheck()
  }

  async startHealthcheck() {
    clearInterval(this.timer)

    // Check health only for enabled nodes
    if (this.active) {
      try {
        const health = await this.checkHealth()

        this.height = health.height
        this.ping = health.ping
        this.online = true
      } catch (err) {
        this.online = false
      }

      this.fireStatusChange()
    }

    this.timer = setTimeout(
      () => this.startHealthcheck(),
      getHealthCheckInterval(
        this.type,
        this.kind,
        this.online ? this.healthCheckInterval : 'crucial'
      )
    )
  }

  updateHealthCheckInterval(interval: HealthcheckInterval) {
    this.healthCheckInterval = interval
  }

  private fireStatusChange() {
    this.onStatusChangeCallback?.(this.getStatus())
  }

  onStatusChange(callback: typeof this.onStatusChangeCallback) {
    this.onStatusChangeCallback = callback
  }

  getStatus() {
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
      hasMinNodeVersion: this.hasMinNodeVersion(),
      displayVersion: this.displayVersion(),
      hasSupportedProtocol: this.hasSupportedProtocol,
      socketSupport: this.socketSupport,
      height: this.height,
      status: this.getNodeStatus(),
      type: this.type,
      label: this.label
    }
  }

  getNodeStatus(): NodeStatus {
    if (!this.active) {
      return 'disabled'
    } else if (!this.hasMinNodeVersion() || !this.hasSupportedProtocol) {
      return 'unsupported_version'
    } else if (!this.online) {
      return 'offline'
    } else if (this.outOfSync) {
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

  /**
   * Enables/disables a node.
   */
  toggleNode(active: boolean) {
    this.active = active

    nodesStorage.saveActive(this.url, active)

    return this.getStatus()
  }

  displayVersion() {
    return this.version ? `v${this.version}` : ''
  }

  // This method is not abstract because Not all nodes need version checking (For example: indexers) or some nodes receive version information from healthcheck requests.
  // Therefore, it is overridden only in the case when a separate request is needed to obtain the version.
  protected fetchNodeVersion() {
    return Promise.resolve()
  }
}

export type NodeStatusResult = ReturnType<Node['getStatus']>
