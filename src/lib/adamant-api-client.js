import { AdmNode } from "@/lib/nodes/AdmNode";

import config from '../config'
import semver from 'semver'

/**
 * Allowed height delta for the nodes.
 *
 * If two nodes' heights differ by no more than this value,
 * they are considered to be in sync with each other.
 */
const HEIGHT_EPSILON = 10

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
class ApiClient {
  /**
   * Creates new client instance
   * @param {Array<string>} endpoints endpoints URLs
   */
  constructor (endpoints = [], minNodeVersion = '0.0.0') {
    /**
     * List of the available nodes
     * @type {Array<ApiNode>}
     */
    this._nodes = endpoints.map(x => new AdmNode(x))

    /**
     * Minimum API version a node is required to have
     * @type {String}
     */
    this._minNodeVersion = minNodeVersion
    /**
     * A callback that is called every time a node status is updated
     * @type {function({url: string, ping: number, online: boolean}): void}
     */
    this._onStatusUpdate = null

    /**
     * Indicates wether `ApiClient` should prefer the fastest node available.
     * @type {Boolean}
     */
    this.useFastest = false

    this._nodeStatus = node => ({
      url: node.url,
      port: node.port,
      hostname: node.hostname,
      protocol: node.protocol,
      wsProtocol: node.wsProtocol,
      wsPort: node.wsPort,
      wsPortNeeded: node.wsPortNeeded,
      online: node.online,
      ping: node.ping,
      version: node.version,
      active: node.active,
      outOfSync: node.outOfSync,
      hasMinNodeVersion: node.version >= this._minNodeVersion,
      hasSupportedProtocol: node.hasSupportedProtocol,
      socketSupport: node.socketSupport
    })

    this._onInit = null

    /**
     * This promise is resolved whenever we get at least one compatible online node
     * after the status update.
     * @type {Promise}
     */
    this._statusPromise = new Promise((resolve, reject) => {
      this._onInit = error => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
        this._onInit = null
      }
    })
  }

  /**
   * Returns endpoint statuses
   * @returns {Array<{ url: string, online: boolean, ping: number }>}
   */
  getNodes () {
    return this._nodes.map(this._nodeStatus)
  }

  /**
   * Initiates the status update for each of the known nodes.
   */
  updateStatus () {
    this._statusPromise = new Promise((resolve, reject) => {
      let done = false

      const promises = this._nodes.filter(x => x.active).map(x => {
        return x.updateStatus().then(() => {
          this._fireStatusUpdate(x)
          // Resolve the `_statusPromise` if it's a good node.
          if (!done && x.online && this._isCompatible(x.version)) {
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
          this._updateSyncStatuses()
        }
      })
    }).then(
      () => { if (this._onInit) this._onInit() },
      error => {
        if (this._onInit) this._onInit(error)
        return Promise.reject(error)
      }
    )
  }

  /**
   * Enables/disables an node.
   * @param {String} url node URL
   * @param {Boolean} active set node active or not
   */
  toggleNode (url, active) {
    const node = this._nodes.find(x => x.url === url)
    if (node) {
      node.active = active
    }
  }

  /**
   * Performs a GET API request.
   * @param {String} url relative API url
   * @param {any} params request params (an object) or a function that accepts `ApiNode` and returns the request params
   */
  get (url, params) {
    return this.request({ method: 'get', url, payload: params })
  }

  /**
   * Performs a POST API request.
   * @param {String} url relative API url
   * @param {any} payload request payload (an object) or a function that accepts `ApiNode` and returns the request payload
   */
  post (url, payload) {
    return this.request({ method: 'post', url, payload })
  }

  /**
   * Performs an API request.
   * @param {RequestConfig} config request config
   */
  request (config) {
    // First wait until we get at least one compatible node
    return this._statusPromise.then(() => {
      const node = this.useFastest
        ? this._getFastestNode()
        : this._getRandomNode()

      if (!node) {
        // All nodes seem to be offline: let's refresh the statuses
        this.updateStatus()
        // But there's nothing we can do right now
        return Promise.reject(new Error('No online nodes at the moment'))
      }

      return node.request(config).catch(error => {
        if (error.code === 'NODE_OFFLINE') {
          // Notify the world that the node is down
          this._fireStatusUpdate(node)
          // Initiate nodes status check
          this.updateStatus()
          // If the selected node is not available, repeat the request with another one.
          return this.request(config)
        }
        throw error
      })
    })
  }

  /**
   * Registers a status update callback.
   * @param {function({url: string, ping: number, online: boolean}): void} callback callback function
   */
  onStatusUpdate (callback) {
    this._onStatusUpdate = callback
  }

  /**
   * Returns a random node.
   * @returns {ApiNode}
   */
  _getRandomNode () {
    const onlineNodes = this._nodes.filter(x =>
      x.online &&
      x.active &&
      !x.outOfSync &&
      this._isCompatible(x.version)
    )
    const node = onlineNodes[Math.floor(Math.random() * onlineNodes.length)]
    return node
  }

  /**
   * Returns the fastest node.
   * @returns {ApiNode}
   */
  _getFastestNode () {
    return this._nodes.reduce((fastest, current) => {
      if (!current.online || !current.active || current.outOfSync || !this._isCompatible(current.version)) {
        return fastest
      }
      return (!fastest || fastest.ping > current.ping) ? current : fastest
    })
  }

  _fireStatusUpdate (node) {
    if (typeof this._onStatusUpdate === 'function') {
      this._onStatusUpdate(this._nodeStatus(node))
    }
  }

  /**
   * Checks if the supplied version is compatible with the minimal allowed one.
   * @param {string} version version to check
   * @returns {boolean}
   */
  _isCompatible (version) {
    return !!(version && semver.gte(version, this._minNodeVersion))
  }

  /**
   * Updates `outOfSync` status of the nodes.
   *
   * Basic idea is the following: we look for the biggest group of nodes that have the same
   * height (considering HEIGHT_EPSILON). These nodes are considered to be in sync with the network,
   * all the others are not.
   */
  _updateSyncStatuses () {
    const nodes = this._nodes.filter(x => x.online && x.active)

    // For each node we take its height and list of nodes that have the same height ± epsilon
    const grouped = nodes.map(node => {
      return {
        /** In case of "win" this height will be considered to be real height of the network */
        height: node.height,
        /** List of nodes with the same (or close) height, including current one */
        nodes: nodes.filter(x => Math.abs(node.height - x.height) <= HEIGHT_EPSILON)
      }
    })

    // A group with the longest same-height nodes list wins.
    // If two groups have the same number of nodes, the one with the biggest height wins.
    const winner = grouped.reduce((out, x) => {
      if (!out) return x
      if (out.nodes.length < x.nodes.length || out.height < x.height) return x
      return out
    }, null)

    // Finally, all the nodes from the winner list are considered to be in sync, all the
    // others are not
    nodes.forEach(node => {
      node.outOfSync = !winner.nodes.includes(node)
      this._fireStatusUpdate(node)
    })
  }
}

const endpoints = config.adm.nodes.map(endpoint => endpoint.url)
const apiClient = new ApiClient(endpoints, config.adm.minNodeVersion)

export default apiClient
