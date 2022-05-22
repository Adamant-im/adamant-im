import axios from 'axios'

import utils from './adamant'
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
 * Protocol on host where app is running, f. e., http: or https:
 */
const appProtocol = location.protocol

/**
 * @typedef {Object} RequestConfig
 * @property {String} url request relative URL
 * @property {string} method request method (defaults to 'get')
 * @property {any} payload request payload
 */

/**
 * Custom error to indicate that the endpoint is not available
 */
class NodeOfflineError extends Error {
  constructor (...args) {
    super('Node is offline', ...args)
    this.code = 'NODE_OFFLINE'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NodeOfflineError)
    }
  }
}

/**
 * Encapsulates an ADAMANT node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
class ApiNode {
  constructor (baseUrl) {
    /**
     * Indicates whether node is active (i.e. user allows the application
     * to interact with this node).
     * @type {Boolean}
     */
    this.active = true

    /**
     * Indicates whether node is out of sync (i.e. its block height is
     * either too big or too small compared to the other nodes)
     * @type {Boolean}
     */
    this.outOfSync = false

    this._baseUrl = baseUrl
    this._protocol = new URL(baseUrl).protocol
    this._port = new URL(baseUrl).port
    this._hostname = new URL(baseUrl).hostname
    this._wsPort = '36668' // default wsPort
    this._wsProtocol = this._protocol === 'https:' ? 'wss:' : 'ws:'
    this._wsPortNeeded = this._wsProtocol === 'ws:' && !this._hostname.includes('.onion')
    this._hasSupportedProtocol = !(this._protocol === 'http:' && appProtocol === 'https:')

    this._online = false
    this._ping = Infinity
    this._timeDelta = 0
    this._version = ''
    this._height = 0
    this._socketSupport = false

    this._client = axios.create({
      baseURL: this._baseUrl
    })
  }

  /**
   * Node base URL
   * @type {String}
   */
  get url () {
    return this._baseUrl
  }

  /**
   * Node port like 36666 for http nodes (default)
   * @type {String}
   */
  get port () {
    return this._port
  }

  /**
   * Node socket port like 36668 (default)
   * @type {String}
   */
  get wsPort () {
    return this._wsPort
  }

  /**
   * Node hostname like bid.adamant.im or 23.226.231.225
   * @type {String}
   */
  get hostname () {
    return this._hostname
  }

  /**
   * Node protocol, like http: or https:
   * @type {String}
   */
  get protocol () {
    return this._protocol
  }

  /**
   * Socket protocol, ws: or wss:
   * @type {String}
   */
  get wsProtocol () {
    return this._wsProtocol
  }

  /**
   * If Socket port like :36668 needed for connection
   * @type {String}
   */
  get wsPortNeeded () {
    return this._wsPortNeeded
  }

  /**
   * Node API version.
   * @type {String}
   */
  get version () {
    return this._version
  }

  /**
   * Indicates whether node is available.
   * @type {Boolean}
   */
  get online () {
    return this._online
  }

  /**
   * Node ping estimation
   * @type {Number}
   */
  get ping () {
    return this._ping
  }

  /**
   * Delta between local time and the node time
   * @type {Number}
   */
  get timeDelta () {
    return this._timeDelta
  }

  /**
   * Current block height
   * @type {Number}
   */
  get height () {
    return this._height
  }

  get socketSupport () {
    return this._socketSupport
  }

  /**
   * Performs an API request.
   *
   * The `payload` of the `cfg` can be either an object or a function that
   * accepts `ApiNode` as a first argument and returns an object.
   * @param {RequestConfig} cfg config
   * @returns {Promise<any>}
   */
  request (cfg) {
    let { url, method, payload } = cfg

    method = (method || 'get').toLowerCase()

    if (typeof payload === 'function') {
      payload = payload(this)
    }

    const config = {
      url,
      method,
      [method === 'get' ? 'params' : 'data']: payload
    }

    return this._client.request(config).then(
      response => {
        const body = response.data
        // Refresh time delta on each request
        if (body && isFinite(body.nodeTimestamp)) {
          this._timeDelta = utils.epochTime() - body.nodeTimestamp
        }

        return body
      },
      error => {
        // According to https://github.com/axios/axios#handling-errors this means, that request was sent,
        // but server could not respond.
        if (!error.response && error.request) {
          this._online = false
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
  updateStatus () {
    return this._getNodeStatus()
      .then(status => {
        if (status.version) {
          this._version = status.version
        }
        if (status.height) {
          this._height = status.height
        }
        if (status.ping) {
          this._ping = status.ping
        }
        if (status.wsPort) {
          this._wsPort = status.wsPort
        }
        this._online = status.online
        this._socketSupport = status.socketSupport
      })
      .catch(() => {
        this._online = false
        this._socketSupport = false
      })
  }

  /**
   * Gets node version, block height and ping.
   * @returns {Promise<{version: string, height: number, ping: number}>}
   */
  _getNodeStatus () {
    if (!this._hasSupportedProtocol) {
      return new Promise((resolve) => {
        resolve({
          online: false,
          socketSupport: false
        })
      })
    } else {
      const time = Date.now()
      return this.request({ url: '/api/node/status' })
        .then(res => {
          if (res.success) {
            return {
              online: true,
              version: res.version.version,
              height: Number(res.network.height),
              ping: Date.now() - time,
              socketSupport: res.wsClient && res.wsClient.enabled,
              wsPort: res.wsClient ? res.wsClient.port : false
            }
          }
          throw new Error('Request to /api/node/status was unsuccessful')
        })
    }
  }
}

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
  constructor (endpoints = [], minApiVersion = '0.0.0') {
    /**
     * List of the available nodes
     * @type {Array<ApiNode>}
     */
    this._nodes = endpoints.map(x => new ApiNode(x))

    /**
     * Minimum API version a node is required to have
     * @type {String}
     */
    this._minApiVersion = minApiVersion
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
      protocol: node._protocol,
      wsProtocol: node._wsProtocol,
      wsPort: node._wsPort,
      wsPortNeeded: node._wsPortNeeded,
      online: node.online,
      ping: node.ping,
      version: node.version,
      active: node.active,
      outOfSync: node.outOfSync,
      hasMinApiVersion: node.version >= this._minApiVersion,
      hasSupportedProtocol: node._hasSupportedProtocol,
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
    return !!(version && semver.gte(version, this._minApiVersion))
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

const endpoints = config.server.adm.map(endpoint => endpoint.url)
const apiClient = new ApiClient(endpoints, config.minApiVersion)

export default apiClient
