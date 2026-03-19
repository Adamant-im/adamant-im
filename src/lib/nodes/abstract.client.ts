import type { HealthcheckInterval, NodeKind, NodeType } from '@/lib/nodes/types'
import { TNodeLabel } from '@/lib/nodes/constants'
import { AllNodesDisabledError, AllNodesOfflineError, isNodeOfflineError } from './utils/errors'
import { filterSyncedNodes } from './utils/filterSyncedNodes'
import { Node } from './abstract.node'
import { nodesStorage } from './storage'

const INITIAL_HEALTHCHECK_SYNC_THRESHOLD = 0.3

export abstract class Client<N extends Node> {
  /**
   * List of the available nodes
   */
  nodes: N[] = []
  /**
   * Minimum API version a node is required to have
   */
  minNodeVersion = ''
  /**
   * Indicates wether `ApiClient` should prefer the fastest node available.
   */
  useFastest = false
  /**
   * A callback that is called every time a node status is updated
   */
  statusUpdateCallback?: (status: ReturnType<Node['getStatus']>) => void
  /**
   * Node kind
   */
  kind: NodeKind
  /**
   * Node type
   */
  type: NodeType
  /**
   * Node label
   */
  label: TNodeLabel

  /**
   * Resolves when at least one node is ready to accept requests
   */
  ready: Promise<void>
  resolve = () => {}
  initialized = false

  constructor(type: NodeType, kind: NodeKind, label: TNodeLabel) {
    this.type = type
    this.kind = kind
    this.label = label
    this.useFastest = nodesStorage.getUseFastest(type)

    this.ready = new Promise((resolve) => {
      this.resolve = () => {
        if (this.initialized) return

        this.initialized = true
        resolve()
      }
    })
  }

  protected async watchNodeStatusChange() {
    for (const node of this.nodes) {
      node.onStatusChange(() => {
        this.syncInitialHealthcheckStatus()
        this.updateSyncStatuses()

        this.statusUpdateCallback?.(node.getStatus())

        if (this.isActiveNode(node)) {
          // Resolve when at least one node is ready to accept requests
          this.resolve()
        }
      })
    }

    await Promise.all(this.nodes.map((node) => node.startHealthcheck()))
    this.resolve()
  }

  /**
   * Initiates healthcheck for each node.
   */
  checkHealth() {
    for (const node of this.nodes) {
      void node.startHealthcheck()
    }
  }

  updateHealthCheckInterval(interval: HealthcheckInterval) {
    for (const node of this.nodes) {
      void node.updateHealthCheckInterval(interval)
    }
  }

  /**
   * Invokes a client method.
   *
   * eth
   *   .useClient((client) => client().getTransactionCount(this.$store.state.eth.address))
   *   .then(res => logger.log("eth-client", "debug", "res", res))
   *   .catch(err => logger.log("eth-client", "warn", "err", err))
   *
   * @param cb
   */
  async useClient<T>(cb: (client: N['client']) => T) {
    return this.requestWithRetry((node) => cb(node.client))
  }

  /**
   * Returns endpoint statuses
   * @returns {Array<{ url: string, online: boolean, ping: number }>}
   */
  getNodes() {
    this.syncInitialHealthcheckStatus()
    this.updateSyncStatuses()

    return this.nodes.map((node) => node.getStatus())
  }

  /**
   * Enables/disables a node.
   */
  toggleNode(url: string, active: boolean) {
    const node = this.nodes.find((x) => x.url === url)
    if (node) {
      return node.toggleNode(active)
    }
  }

  setUseFastest(state: boolean) {
    this.useFastest = state

    nodesStorage.setUseFastest(state, this.type, this.kind)
  }

  /**
   * Registers a status update callback.
   * @param {function({url: string, ping: number, online: boolean}): void} callback callback function
   */
  onStatusUpdate(callback: typeof this.statusUpdateCallback) {
    this.statusUpdateCallback = callback
  }

  /**
   * Returns a random node.
   * @returns {ApiNode}
   */
  protected getRandomNode(onlineNodes = this.nodes.filter(this.isActiveNode)) {
    return onlineNodes[Math.floor(Math.random() * onlineNodes.length)]
  }

  /**
   * Returns the fastest node.
   */
  protected getFastestNode(onlineNodes = this.nodes.filter(this.isActiveNode)) {
    if (onlineNodes.length === 0) return undefined
    return onlineNodes.reduce((fastest, current) =>
      current.ping < fastest.ping ? current : fastest
    )
  }

  protected getNode(excludedUrls: Set<string> = new Set()) {
    const activeNodes = this.nodes.filter((node) => node.active)
    if (activeNodes.length === 0) {
      throw new AllNodesDisabledError(this.type)
    }

    const availableNodes = activeNodes.filter(
      (node) => !excludedUrls.has(node.url) && this.isActiveNode(node)
    )
    const node = this.useFastest
      ? this.getFastestNode(availableNodes)
      : this.getRandomNode(availableNodes)

    if (!node) {
      // All nodes seem to be offline: let's refresh the statuses
      this.checkHealth()
      // But there's nothing we can do right now
      throw new AllNodesOfflineError(this.type)
    }

    return node
  }

  /**
   * Throws an error if all the nodes are offline.
   */
  assertAnyNodeOnline() {
    const onlineNodes = this.nodes.filter(this.isActiveNode)

    if (onlineNodes.length === 0) {
      throw new AllNodesOfflineError(this.type)
    }
  }

  /**
   * Updates `outOfSync` status of the nodes.
   *
   * Basic idea is the following: we look for the biggest group of nodes that have the same
   * height (considering HEIGHT_EPSILON). These nodes are considered to be in sync with the network,
   * all the others are not.
   */
  protected updateSyncStatuses() {
    if (!this.shouldUpdateSyncStatuses()) {
      return
    }

    const nodes = this.nodes.filter((x) => x.online && x.active && x.healthcheckAttemptCount > 0)

    const nodesInSync = filterSyncedNodes(nodes, this.label)

    // Finally, all the nodes from the winner list are considered to be in sync, all the
    // others are not
    for (const node of this.nodes) {
      if (!nodes.includes(node)) {
        node.outOfSync = false
        continue
      }

      node.outOfSync = !nodesInSync.nodes.includes(node)
    }
  }

  private syncInitialHealthcheckStatus() {
    const initialHealthcheckInProgress = this.nodes.some(
      (node) => node.active && node.healthcheckAttemptCount < 1
    )

    for (const node of this.nodes) {
      node.initialHealthcheckInProgress = initialHealthcheckInProgress
    }
  }

  protected async requestWithRetry<T>(request: (node: N) => Promise<T> | T): Promise<T> {
    await this.ready

    const triedNodes = new Set<string>()

    while (true) {
      const node = this.getNode(triedNodes)

      try {
        return await Promise.resolve(request(node))
      } catch (error) {
        if (!this.isNodeUnavailableError(error)) {
          throw error
        }

        triedNodes.add(node.url)
        this.markNodeAsUnavailable(node)
      }
    }
  }

  private isNodeUnavailableError(error: unknown) {
    if (!error || typeof error !== 'object') {
      return false
    }

    if (isNodeOfflineError(error as Error)) {
      return true
    }

    const networkError = error as {
      response?: unknown
      request?: unknown
      code?: string
      name?: string
      message?: string
    }

    if (networkError.code === 'ERR_CANCELED' || networkError.name === 'CanceledError') {
      return false
    }

    if (!networkError.response && networkError.request) {
      return true
    }

    const offlineCodes = new Set([
      'ECONNABORTED',
      'ECONNREFUSED',
      'EHOSTUNREACH',
      'ENETUNREACH',
      'ENOTFOUND',
      'ERR_NETWORK',
      'ETIMEDOUT'
    ])

    if (networkError.code && offlineCodes.has(networkError.code)) {
      return true
    }

    const message = (networkError.message || '').toLowerCase()

    return message.includes('failed to fetch') || message.includes('network error')
  }

  private markNodeAsUnavailable(node: N) {
    node.online = false
    node.ping = Infinity
    node.outOfSync = false

    this.syncInitialHealthcheckStatus()
    this.updateSyncStatuses()
    this.statusUpdateCallback?.(node.getStatus())
  }

  private shouldUpdateSyncStatuses() {
    const activeNodes = this.nodes.filter((node) => node.active)

    if (activeNodes.length === 0) {
      return false
    }

    const respondedInitially = activeNodes.filter((node) => node.healthcheckAttemptCount > 0).length
    const initialHealthcheckInProgress = respondedInitially < activeNodes.length

    if (initialHealthcheckInProgress) {
      return respondedInitially / activeNodes.length >= INITIAL_HEALTHCHECK_SYNC_THRESHOLD
    }

    const [firstNode] = activeNodes
    const allNodesReachedSameAttemptCount = activeNodes.every(
      (node) => node.healthcheckAttemptCount === firstNode.healthcheckAttemptCount
    )

    return allNodesReachedSameAttemptCount
  }

  protected isActiveNode(node: Node) {
    return (
      node.online &&
      node.active &&
      !node.outOfSync &&
      node.hasMinNodeVersion() &&
      node.hasSupportedProtocol
    )
  }
}
