import axios from 'axios'

import utils from './adamant'
import config from '../config.json'
import semver from 'semver'

/**
 * @typedef {Object} RequestConfig
 * @property {String} url request relative URL
 * @property {string} method request method (defaults to 'get')
 * @property {any} payload request payload
 */

/**
 * Custom error to indicate that the endpoint is not available
 */
class EndpointOfflineError extends Error {
  constructor (...args) {
    super('Endpoint is offline', ...args)
    this.code = 'ENDPOINT_OFFLINE'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EndpointOfflineError)
    }
  }
}

/**
 * Encapsulates an ADAMANT endpoint. Provides methods to send API-requests
 * to the endpoint and verify is status (online/offline, version, ping, etc.)
 */
class ApiEndpoint {
  constructor (baseUrl) {
    /**
     * Indicates whether endpoint is active (i.e. user allows the application
     * to interact with this endpoint).
     * @type {Boolean}
     */
    this.active = true

    this._baseUrl = baseUrl
    this._online = true
    this._ping = 0
    this._timeDelta = 0
    this._version = ''

    this._client = axios.create({
      baseURL: this._baseUrl
    })
  }

  /**
   * Endpoint base URL
   * @type {String}
   */
  get endpointUrl () {
    return this._baseUrl
  }

  /**
   * Endpoint API version.
   * @type {String}
   */
  get version () {
    return this._version
  }

  /**
   * Indicates whether endpoint is available.
   * @type {Boolean}
   */
  get online () {
    return this._online
  }

  /**
   * Endpoint ping estimation
   * @type {Number}
   */
  get ping () {
    return this._ping
  }

  /**
   * Delta between local time and the endpoint time
   * @type {Number}
   */
  get timeDelta () {
    return this._timeDelta
  }

  /**
   * Performs an API request.
   * 
   * The `payload` of the `cfg` can be either an object or a function that
   * accepts `ApiEndpoint` as a first argument and returns an object.
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
          throw new EndpointOfflineError()
        }
        throw error
      }
    )
  }

  /**
   * Intitates endpoint status update: version, ping, online/offline.
   * @returns {PromiseLike}
   */
  updateStatus () {
    const time = Date.now()
    return this.request({ url: '/api/peers/version' }).then(
      body => {
        // A decent endpoint must have version
        this._online = !!body.version
        this._version = body.version
        this._ping = Date.now() - time
      },
      () => {
        this._online = false
      }
    )
  }
}

/**
 * Provides methods for calling the ADAMANT API.
 * 
 * The `ApiClient` instance automatically selects an ADAMANT endpoint to
 * send the API-requests to and swicthes to another node if the current one
 * is not available at the moment.
 */
class ApiClient {
  /**
   * Creates new client instance
   * @param {Array<string>} endpoints endpoints URLs
   */
  constructor (endpoints = [], minApiVersion = '0.0.0') {
    /** 
     * List of the available endpoints
     * @type {Array<ApiEndpoint>}
     */
    this._endpoints = endpoints.map(x => new ApiEndpoint(x))

    /**
     * Minimum API version an endpoint is required to have
     * @type {String}
     */
    this._minApiVersion = minApiVersion
    /**
     * A callback that is called every time an endpoint status is updated
     * @type {function({url: string, ping: number, online: boolean}): void}
     */
    this._onStatusUpdate = null

    /**
     * Indicates wether `ApiClient` should prefer the fastest endpoint available.
     * @type {Boolean}
     */
    this.useFastest = false

    this._getEndpointStatus = endpoint => ({
      url: endpoint.endpointUrl,
      online: endpoint.online,
      ping: endpoint.ping,
      version: endpoint.version,
      active: endpoint.active
    })

    /**
     * This promise is resolved whenever we get at least one compatible online endpoint
     * after the status update.
     * @type {Promise}
     */
    this._statusPromise = null

    this.updateStatus()
  }

  /**
   * Returns enpoints statuses
   * @returns {Array<{ url: string, online: boolean, ping: number }>}
   */
  getEndpoints () {
    return this._endpoints.map(this._getEndpointStatus)
  }

  /**
   * Initiates the status update for each of the known endpoints.
   */
  updateStatus () {
    this._statusPromise = new Promise((resolve, reject) => {
      let done = false

      const promises = this._endpoints.filter(x => x.active).map(x => {
        return x.updateStatus().then(() => {
          this._fireStatusUpdate(x)
          // Resolve the `_statusPromise` if it's a good endpoint.
          if (!done && x.online && this._isCompatible(x.version)) {
            resolve()
          }
        })
      })

      Promise.all(promises).then(() => {
        // If all endpoints have been checked and none of them is online or
        // compatible, throw an error to indicate that we're unable to send
        // requests at the moment.
        if (!done) reject(new Error('No compatible nodes at the moment'))
      })
    })
  }

  /**
   * Enables/disables an endpoint.
   * @param {String} url endpoint URL
   * @param {Boolean} active set endpoint active or not
   */
  toggleEndpoint (url, active) {
    const endpoint = this._endpoints.find(x => x.endpointUrl === url)
    if (endpoint) {
      endpoint.active = active
    }
  }

  /**
   * Performs a GET API request.
   * @param {String} url relative API url
   * @param {any} params request params (an object) or a function that accepts `ApiEndpoint` and returns the request params
   */
  get (url, params) {
    return this.request({ method: 'get', url, payload: params })
  }

  /**
   * Performs a POST API request.
   * @param {String} url relative API url
   * @param {any} payload request payload (an object) or a function that accepts `ApiEndpoint` and returns the request payload
   */
  post (url, payload) {
    return this.request({ method: 'post', url, payload })
  }

  /**
   * Performs an API request.
   * @param {RequestConfig} config 
   */
  request (config) {
    // First wait until we get at least one compatible endpoint
    return this._statusPromise.then(() => {
      const endpoint = this.useFastest
        ? this._getFastestEndpoint()
        : this._getRandomEndpoint()

      if (!endpoint) {
        // All endpoints seem to be offline: let's refresh the statuses
        this.updateStatus()
        // But there's nothing we can do right now
        return Promise.reject(new Error('No online nodes at the moment'))
      }

      return endpoint.request(config).catch(error => {
        if (error.code === 'ENDPOINT_OFFLINE') {
          // Notify the world that the endpoint is down
          this._fireStatusUpdate(endpoint)
          // If the selected endpoint is not available, repeat the request with another one.
          return this.request(config)
        }
        throw error
      })
    })
  }

  /**
   * Registers a status update callback.
   * @param {function({url: string, ping: number, online: boolean}): void} callback 
   */
  onStatusUpdate (callback) {
    this._onStatusUpdate = callback
  }

  /**
   * Returns a random endpoint
   * @returns {ApiEndpoint}
   */
  _getRandomEndpoint () {
    const onlineEndpoints = this._endpoints.filter(x =>
      x.online &&
      x.active &&
      this._isCompatible(x.version)
    )
    const endpoint = onlineEndpoints[Math.floor(Math.random() * onlineEndpoints.length)]
    return endpoint
  }

  /**
   * Returns the fastest endpoint.
   * @returns {ApiEndpoint}
   */
  _getFastestEndpoint () {
    return this._endpoints.reduce((fastest, current) => {
      if (!current.online || !current.active || !this._isCompatible(current.version)) {
        return fastest
      }
      return (!fastest || fastest.ping > current.ping) ? current : fastest
    })
  }

  _fireStatusUpdate (endpoint) {
    if (typeof this._onStatusUpdate === 'function') {
      this._onStatusUpdate(this._getEndpointStatus(endpoint))
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
}

const endpoints = config.server.adm.map(endpoint =>
  [
    endpoint.protocol,
    '://',
    endpoint.ip,
    endpoint.port ? (':' + endpoint.port) : '',
    endpoint.path ? ('/' + endpoint.path) : ''
  ].join('')
)

const apiClient = new ApiClient(endpoints, config.minApiVersion)

export default apiClient
