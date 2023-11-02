import type { NodeType } from '@/lib/nodes/types'
import { filterSyncedNodes } from './utils/filterSyncedNodes'
import { Node } from './abstract.node'
import { nodesStorage } from './storage'

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
   * Node type
   */
  type: NodeType

  constructor(type: NodeType) {
    this.type = type
    this.useFastest = nodesStorage.getUseFastest(type)
  }

  protected async watchNodeStatusChange() {
    for (const node of this.nodes) {
      node.onStatusChange((node) => {
        this.updateSyncStatuses()

        this.statusUpdateCallback?.(node)
      })
    }
  }

  /**
   * Initiates healthcheck for each node.
   */
  checkHealth() {
    for (const node of this.nodes) {
      void node.startHealthcheck()
    }
  }

  getClient(): N['client'] {
    const node = this.useFastest ? this.getFastestNode() : this.getRandomNode()

    if (!node) {
      throw new Error('No available nodes at the moment')
    }

    return node.client
  }

  /**
   * Returns endpoint statuses
   * @returns {Array<{ url: string, online: boolean, ping: number }>}
   */
  getNodes() {
    return this.nodes.map((node) => node.getStatus())
  }

  /**
   * Enables/disables a node.
   */
  toggleNode(url: string, active: boolean) {
    const node = this.nodes.find((x) => x.url === url)
    if (node) {
      node.toggleNode(active)
    }
  }

  setUseFastest(state: boolean) {
    this.useFastest = state

    nodesStorage.setUseFastest(state, this.type)
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
  protected getRandomNode() {
    const onlineNodes = this.nodes.filter((x) => x.online && x.active && !x.outOfSync)
    const node = onlineNodes[Math.floor(Math.random() * onlineNodes.length)]
    return node
  }

  /**
   * Returns the fastest node.
   */
  protected getFastestNode() {
    return this.nodes.reduce((fastest, current) => {
      if (!current.online || !current.active || current.outOfSync) {
        return fastest
      }
      return !fastest || fastest.ping > current.ping ? current : fastest
    })
  }

  /**
   * Updates `outOfSync` status of the nodes.
   *
   * Basic idea is the following: we look for the biggest group of nodes that have the same
   * height (considering HEIGHT_EPSILON). These nodes are considered to be in sync with the network,
   * all the others are not.
   */
  protected updateSyncStatuses() {
    const nodes = this.nodes.filter((x) => x.online && x.active)

    const nodesInSync = filterSyncedNodes(nodes)

    // Finally, all the nodes from the winner list are considered to be in sync, all the
    // others are not
    for (const node of nodes) {
      node.outOfSync = !nodesInSync.nodes.includes(node)
    }
  }
}
