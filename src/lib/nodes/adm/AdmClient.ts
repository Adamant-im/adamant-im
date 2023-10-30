import { isNodeOfflineError } from '@/lib/nodes/utils/errors'
import { NodeInfo } from '@/types/wallets'
import { AdmNode, Payload, RequestConfig } from './AdmNode'
import { filterSyncedNodes } from '../utils/filterSyncedNodes'

import config from '@/config'
import semver from 'semver'

/**
 * Interval how often to update node statuses
 */
const REVISE_CONNECTION_TIMEOUT = 5000

/**
 * Provides methods for calling the ADAMANT API.
 *
 * The `ApiClient` instance automatically selects an ADAMANT node to
 * send the API-requests to and switches to another node if the current one
 * is not available at the moment.
 */
class AdmClient {
  /**
   * List of the available nodes
   */
  nodes: AdmNode[]
  /**
   * Minimum API version a node is required to have
   */
  minNodeVersion: string
  /**
   * A callback that is called every time a node status is updated
   */
  statusUpdateCallback?: (status: ReturnType<AdmNode['getNodeStatus']>) => void
  /**
   * Indicates wether `ApiClient` should prefer the fastest node available.
   */
  useFastest: boolean
  /**
   * This promise is resolved whenever we get at least one compatible online node
   * after the status update.
   */
  statusPromise: Promise<void>
  onInit?: (error?: Error) => void

  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    this.nodes = endpoints.map((endpoint) => new AdmNode(endpoint))
    this.minNodeVersion = minNodeVersion

    this.useFastest = false

    this.statusPromise = new Promise((resolve, reject) => {
      this.onInit = (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
        this.onInit = undefined
      }
    })
  }

  /**
   * Returns endpoint statuses
   * @returns {Array<{ url: string, online: boolean, ping: number }>}
   */
  getNodes() {
    return this.nodes.map((node) => node.getNodeStatus())
  }

  /**
   * Initiates the status update for each of the known nodes.
   */
  updateStatus() {
    this.statusPromise = new Promise<void>((resolve, reject) => {
      let done = false

      const activeNodes = this.nodes.filter((node) => node.active)

      const promises = activeNodes.map((node) => {
        return node.updateStatus().then(() => {
          this.fireStatusUpdate(node)
          // Resolve the `statusPromise` if it's a good node.
          if (!done && node.online && this.isCompatible(node.version)) {
            done = true
            resolve()
          }
        })
      })

      Promise.all(promises).then(() => {
        // If all nodes have been checked and none of them is online or
        // compatible, throw an error to indicate that we're unable to send
        // requests at the moment.
        if (!done) {
          reject(new Error('No compatible nodes at the moment'))
          // Schedule a status update after a while
          setTimeout(() => this.updateStatus(), REVISE_CONNECTION_TIMEOUT)
        } else {
          this.updateSyncStatuses()
        }
      })
    })
      .then(() => {
        if (this.onInit) this.onInit()
      })
      .catch((error) => {
        if (this.onInit) this.onInit(error)
        return Promise.reject(error)
      })
  }

  /**
   * Enables/disables an node.
   * @param {String} url node URL
   * @param {Boolean} active set node active or not
   */
  toggleNode(url: string, active: boolean) {
    const node = this.nodes.find((x) => x.url === url)
    if (node) {
      node.active = active
    }
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
  async request<P extends Payload = Payload>(config: RequestConfig<P>): Promise<any> {
    // First wait until we get at least one compatible node
    await this.statusPromise

    const node = this.useFastest ? this.getFastestNode() : this.getRandomNode()
    if (!node) {
      // All nodes seem to be offline: let's refresh the statuses
      this.updateStatus()
      // But there's nothing we can do right now
      return Promise.reject(new Error('No online nodes at the moment'))
    }

    return node.request(config).catch((error) => {
      if (isNodeOfflineError(error)) {
        // Notify the world that the node is down
        this.fireStatusUpdate(node)
        // Initiate nodes status check
        this.updateStatus()
        // If the selected node is not available, repeat the request with another one.
        return this.request(config)
      }
      throw error
    })
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
  private getRandomNode() {
    const onlineNodes = this.nodes.filter(
      (x) => x.online && x.active && !x.outOfSync && this.isCompatible(x.version)
    )
    const node = onlineNodes[Math.floor(Math.random() * onlineNodes.length)]
    return node
  }

  /**
   * Returns the fastest node.
   */
  private getFastestNode() {
    return this.nodes.reduce((fastest, current) => {
      if (
        !current.online ||
        !current.active ||
        current.outOfSync ||
        !this.isCompatible(current.version)
      ) {
        return fastest
      }
      return !fastest || fastest.ping > current.ping ? current : fastest
    })
  }

  private fireStatusUpdate(node: AdmNode) {
    if (typeof this.statusUpdateCallback === 'function') {
      this.statusUpdateCallback(node.getNodeStatus())
    }
  }

  /**
   * Checks if the supplied version is compatible with the minimal allowed one.
   * @param {string} version version to check
   * @returns {boolean}
   */
  private isCompatible(version: string) {
    return !!(version && semver.gte(version, this.minNodeVersion))
  }

  /**
   * Updates `outOfSync` status of the nodes.
   *
   * Basic idea is the following: we look for the biggest group of nodes that have the same
   * height (considering HEIGHT_EPSILON). These nodes are considered to be in sync with the network,
   * all the others are not.
   */
  private updateSyncStatuses() {
    const nodes = this.nodes.filter((x) => x.online && x.active)

    const nodesInSync = filterSyncedNodes(nodes)

    // Finally, all the nodes from the winner list are considered to be in sync, all the
    // others are not
    for (const node of nodes) {
      node.outOfSync = !nodesInSync.nodes.includes(node)
      this.fireStatusUpdate(node)
    }
  }
}

const endpoints = (config.adm.nodes as NodeInfo[]).map((endpoint) => endpoint.url)
const apiClient = new AdmClient(endpoints, config.adm.minNodeVersion)

export default apiClient
