import { NodeOfflineError } from '@/lib/nodes/utils/errors'
import { getConnectionAwareTimeout } from '@/lib/network/connection'
import type { NodeInfo } from '@/types/wallets/index.ts'
import { getNodeHealthcheckConfig } from './utils/getHealthcheckConfig'
import { TNodeLabel } from './constants'
import { HealthcheckInterval, HealthcheckResult, NodeKind, NodeStatus, NodeType } from './types'
import { nodesStorage } from './storage'
import { logger } from '@/utils/devTools/logger'

type HttpProtocol = 'http:' | 'https:'
type WsProtocol = 'ws:' | 'wss:'

function isValidHttpUrl(url: string): boolean {
  try {
    const protocol = new URL(url).protocol

    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Protocol on host where app is running, f. e., http: or https:
 */
const appProtocol = location.protocol

const DEFAULT_HEALTHCHECK_REQUEST_TIMEOUT_MS = 10_000

type HealthcheckTimeouts = {
  requestTimeoutMs: number
  staleTimeoutMs: number
}

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
   * Indicates that a node URL protocol is the same as page URL.
   */
  hasSupportedProtocol = true
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

  /** Healthcheck related params. */
  /**
   * Indicates whether node is available.
   */
  online = true
  /**
   * Indicates whether prefer a node with alternative IP or not
   */
  preferDomain = true
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
  healthcheckCount = 0
  healthcheckAttemptCount = 0
  initialHealthcheckInProgress = true
  healthCheckInterval: HealthcheckInterval = 'normal'
  client: C
  healthcheckInProgress = false
  healthcheckStartedAt = 0
  healthcheckRequestTimeoutMs = DEFAULT_HEALTHCHECK_REQUEST_TIMEOUT_MS
  healthcheckStaleTimeoutMs = DEFAULT_HEALTHCHECK_REQUEST_TIMEOUT_MS * 2

  constructor(
    endpoint: NodeInfo,
    type: NodeType,
    kind: NodeKind,
    label: TNodeLabel,
    version = '',
    minNodeVersion = ''
  ) {
    const { alt_ip, url } = endpoint

    if (!isValidHttpUrl(url)) {
      throw new TypeError(`Invalid node URL: ${url}`)
    }

    if (alt_ip && !isValidHttpUrl(alt_ip)) {
      logger.log('HealthCheck', 'warn', `Invalid alt_ip "${alt_ip}" for node ${url}. Ignoring it.`)
    }

    this.altIp = alt_ip && isValidHttpUrl(alt_ip) ? alt_ip : undefined
    this.url = url
    this.type = type
    this.label = label
    this.kind = kind
    this.protocol = new URL(url).protocol as HttpProtocol
    this.port = new URL(url).port
    this.hostname = new URL(url).hostname
    this.minNodeVersion = minNodeVersion
    this.version = version
    this.hasSupportedProtocol = this.isHttpAllowed(this.protocol)
    this.active = nodesStorage.isActive(url)
    const { requestTimeoutMs, staleTimeoutMs } = this.resolveHealthcheckTimeouts()
    this.healthcheckRequestTimeoutMs = requestTimeoutMs
    this.healthcheckStaleTimeoutMs = staleTimeoutMs

    this.client = this.buildClient()

    if (this.active) {
      void this.fetchNodeVersion()
    }
  }

  async startHealthcheck() {
    clearTimeout(this.timer)

    const hasStaleHealthcheck =
      this.healthcheckInProgress &&
      this.healthcheckStartedAt > 0 &&
      Date.now() - this.healthcheckStartedAt >
        this.getEffectiveTimeout(this.healthcheckStaleTimeoutMs)

    if (hasStaleHealthcheck) {
      logger.log(
        'HealthCheck',
        'warn',
        `Health-check got stuck for ${this.getBaseURL(this)}. Restarting a new cycle.`
      )
      this.healthcheckInProgress = false
      this.healthcheckStartedAt = 0
    }

    if (this.active && !this.healthcheckInProgress) {
      const getCurrentProtocol = (): HttpProtocol => {
        const baseURL = this.getBaseURL(this)
        return new URL(baseURL || this.url).protocol as HttpProtocol
      }

      const setOnlineStatus = ({ height, ping }: HealthcheckResult, protocol: HttpProtocol) => {
        if (!this.healthcheckCount) {
          logger.log(
            'HealthCheck',
            'info',
            `Connection via ${this.getBaseURL(this)} succeeded (URL: ${this.url}${this.altIp ? ', IP: ' + this.altIp : ''}).`
          )
        }

        /**
         * HTTP request might be fulfilled in HTTPS environment if a user allowed insecure content for the site in own Site settings (desktop browsers).
         */
        if (protocol === 'http:') this.hasSupportedProtocol = true

        this.healthcheckCount++
        this.height = height
        this.online = true
        this.ping = ping

        logger.log(
          'HealthCheck',
          'debug',
          `Node status updated for ${this.getBaseURL(this)}. Height: ${height}. Ping: ${ping}. Count: ${this.healthcheckCount}. Node is online.`
        )
      }

      const logConnectionFailed = (code: string) => {
        logger.log(
          'HealthCheck',
          'info',
          `Connection via ${this.getBaseURL(this)} failed (URL: ${this.url}${this.altIp ? ', IP: ' + this.altIp : ''}). ${code ? `Error code: ${code}` : ''}.`
        )
      }

      const handleFailedCheck = (protocol: HttpProtocol) => {
        if (this.preferDomain) {
          if (!this.altIp) {
            if (protocol === 'https:' || this.isHttpAllowed(protocol)) this.online = false
            logger.log(
              'HealthCheck',
              'info',
              `Alternative IP is not defined for ${this.getBaseURL(this)}. Node is offline.`
            )
          } else if (this.healthcheckCount < 1) {
            // Connection type is not determined yet, so fallback to alt IP is still allowed.
            this.preferDomain = false
          } else {
            // Connection type is already determined for the current session.
            // Do not switch between domain/IP here: keep selected type and mark node temporarily offline.
            this.online = false
          }
        } else {
          this.online = false
          logger.log(
            'HealthCheck',
            'info',
            `Node is not reachable by URL ${this.url}${this.altIp ? ' and by alternative IP ' + this.altIp : ''}. Node is offline.`
          )
          if (this.healthcheckCount < 1) {
            if (this.altIp) {
              // Connection type is not determined yet (both domain and alt IP failed).
              // Restart from domain on the next cycle to keep trying domain -> IP
              // until one of them succeeds.
              this.preferDomain = true
            }
          }
        }
      }

      try {
        this.healthcheckInProgress = true
        this.healthcheckStartedAt = Date.now()
        // Protocol of the most recent check attempt (domain first, alt IP fallback if needed).
        let protocol = getCurrentProtocol()

        try {
          setOnlineStatus(await this.checkHealthWithTimeout(), protocol)
        } catch (error) {
          logConnectionFailed((error as NodeOfflineError).code ?? 'unknown')

          const shouldTryAltIpNow = this.preferDomain && this.altIp && this.healthcheckCount < 1

          if (shouldTryAltIpNow) {
            this.preferDomain = false
            protocol = getCurrentProtocol()

            try {
              setOnlineStatus(await this.checkHealthWithTimeout(), protocol)
            } catch (fallbackError) {
              logConnectionFailed((fallbackError as NodeOfflineError).code ?? 'unknown')
              handleFailedCheck(protocol)
            }
          } else {
            handleFailedCheck(protocol)
          }
        }
      } finally {
        this.updateURL()
        this.healthcheckAttemptCount++
        this.healthcheckInProgress = false
        this.healthcheckStartedAt = 0
      }

      this.fireStatusChange()
    }

    // Keep healthcheck loop active regardless of tab visibility.
    // In background tabs browsers may throttle timers; resume hooks trigger
    // an immediate refresh when app becomes active again.
    this.timer = setTimeout(
      () => this.startHealthcheck(),
      this.getHealthCheckInterval(this.online ? this.healthCheckInterval : 'crucial')
    )

    return this
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

  /**
   * Get base URL for requests depending on availability of a node's domain.
   * @param { Node } node A node instance.
   * @returns { string } Base URL.
   */
  getBaseURL(node: Node): string {
    const baseURL = node.preferDomain ? node.url : (node.altIp ?? node.url)

    return baseURL
  }

  getStatus() {
    const status = this.getNodeStatus()
    const isInitialStatus = this.healthcheckAttemptCount < 1
    const isUnavailableStatus = status === 'offline'

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
      status,
      isUpdating:
        this.active &&
        isInitialStatus &&
        (this.initialHealthcheckInProgress || isUnavailableStatus),
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

  /**
   * Can not be sure, whether HTTP nodes are allowed or blocked in HTTPS environment, until an actual request is fulfilled.
   * Therefore, only assume HTTP is not allowed in HTTPS environment in advance here.
   * @param { "http:" | "https:" } protocol Data transfer protocol.
   * @returns { boolean } Whether a HTTP node is allowed or not.
   */
  isHttpAllowed(protocol: string): boolean {
    const allowed = !(protocol === 'http:' && appProtocol === 'https:')

    return allowed
  }

  protected abstract checkHealth(): Promise<HealthcheckResult>
  protected abstract buildClient(): C

  /**
   * Enables/disables a node.
   */
  toggleNode(active: boolean) {
    this.active = active

    /** Reset properties for HealthCheck to default if a node enabled again. */
    if (active) {
      this.healthcheckCount = 0
      this.healthcheckAttemptCount = 0
      this.initialHealthcheckInProgress = true
      this.online = false
      this.outOfSync = false
      this.height = 0
      this.ping = Infinity
      this.preferDomain = true
      void this.startHealthcheck()
      void this.fetchNodeVersion()
    }

    nodesStorage.saveActive(this.url, active)

    return this.getStatus()
  }

  /**
   * Update URL components depending on availability of a node by URL with domain.
   * `altIp` and `url` always contain 'http:' or 'https:' in address.
   */
  updateURL() {
    const baseURL = this.getBaseURL(this)

    /** New URL constructor requires `baseURL` to be a valid URL, otherwise throws TypeError. */
    if (baseURL) {
      // Keep status fields in sync with the currently selected endpoint (domain or alt IP).
      const parsedBaseURL = new URL(baseURL)

      this.hostname = parsedBaseURL.hostname
      this.port = parsedBaseURL.port
      this.protocol = parsedBaseURL.protocol as HttpProtocol
    }
    this.wsProtocol = this.protocol === 'https:' ? 'wss:' : 'ws:'
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

  private getHealthCheckInterval(interval: HealthcheckInterval) {
    const healthcheckConfig = getNodeHealthcheckConfig(this.label)

    switch (interval) {
      case 'normal':
        return healthcheckConfig.normalUpdateInterval
      case 'crucial':
        return healthcheckConfig.crucialUpdateInterval
      case 'onScreen':
        return healthcheckConfig.onScreenUpdateInterval
      default:
        throw new Error(
          `getHealthCheckInterval: Interval ${interval} is not defined in the Node's config`
        )
    }
  }

  private checkHealthWithTimeout() {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    return Promise.race<HealthcheckResult>([
      this.checkHealth(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new NodeOfflineError())
        }, this.getEffectiveTimeout(this.healthcheckRequestTimeoutMs))
      })
    ]).finally(() => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    })
  }

  private resolveHealthcheckTimeouts(): HealthcheckTimeouts {
    const healthcheckConfig = getNodeHealthcheckConfig(this.label) as {
      onScreenUpdateInterval?: number
      requestTimeoutMs?: number
      staleTimeoutMs?: number
    }
    /**
     * Request timeout is configurable per node/service:
     * 1) explicit `healthCheck.requestTimeoutMs` from config
     * 2) fallback to `healthCheck.onScreenUpdateInterval` (adamant-wallets baseline)
     * 3) final fallback `10_000 ms`.
     */
    const requestTimeoutMs = this.normalizeTimeout(
      healthcheckConfig.requestTimeoutMs ?? healthcheckConfig.onScreenUpdateInterval
    )
    /**
     * Stale timeout protects from "stuck in progress" health checks (e.g., after sleep/resume).
     * If a health check exceeds this value, the next cycle force-resets the lock.
     */
    const staleTimeoutMs = this.normalizeTimeout(
      healthcheckConfig.staleTimeoutMs,
      requestTimeoutMs * 2
    )

    return {
      requestTimeoutMs,
      staleTimeoutMs
    }
  }

  private normalizeTimeout(value?: number, fallback = DEFAULT_HEALTHCHECK_REQUEST_TIMEOUT_MS) {
    return Number.isFinite(value) && value && value > 0 ? Number(value) : fallback
  }

  private getEffectiveTimeout(baseTimeoutMs: number) {
    // Increase final runtime timeout on potentially slow links (3G/data-saver/high RTT/low downlink).
    return getConnectionAwareTimeout(baseTimeoutMs)
  }
}

export type NodeStatusResult = ReturnType<Node['getStatus']>
