import axios from 'axios'

import { epochTime } from './adamant'
import config from '../config.json'

/**
 * @typedef {Object} RequestConfig
 * @property {String} url request relative URL
 * @property {string} method request method (defaults to 'get')
 * @property {(function(ApiEndpoint): object) | object} payload request payload
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

class ApiEndpoint {
  constructor (baseUrl) {
    this._baseUrl = baseUrl
    this._online = true
    this._ping = 0
    this._timeDelta = 0
  }

  get endpointUrl () {
    return this._baseUrl
  }

  get online () {
    return this._online
  }

  get ping () {
    return this._ping
  }

  get timeDelta () {
    return this._timeDelta
  }

  /**
   * Performs an API request
   * @param {RequestConfig} cfg config
   */
  request (cfg) {
    let { url, method, payload } = cfg

    method = (method || 'get').toLowerCase()

    if (typeof payload === 'function') {
      payload = payload(this)
    }

    const config = {
      baseUrl: this._baseUrl,
      url,
      method,
      [method === 'get' ? 'params' : 'data']: payload
    }

    return axios(config).then(
      response => {
        const body = response.data
        if (body && isFinite(body.nodeTimestamp)) {
          this.timeDelta = epochTime() - body.nodeTimestamp
        }
        this._online = true
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

  updateStatus () {
    const time = Date.now()
    return this.request({ url: '/api/peers/version' }).then(body => {
      this._online = true
      this._ping = Date.now() - time
    })
  }
}

class ApiClient {
  /**
   * Creates new client instance
   * @param {Array<string>} endpoints endpoints URLs
   */
  constructor (endpoints = []) {
    /** @type {Array<ApiEndpoint>} */
    this._endpoints = endpoints.map(x => new ApiEndpoint(x.url))
    this.useFastest = false
  }

  /**
   * Returns enpoints statuses
   * @returns {Array<{ url: string, online: boolean, ping: number }>}
   */
  getEndpoints () {
    return this._endpoints.map(x => ({
      url: x.endpointUrl,
      online: x.online,
      ping: x.ping
    }))
  }

  /**
   * Initiates the status update for each of the known endpoints.
   */
  updateStatus () {
    this._endpoints.forEach(x => x.updateStatus())
  }

  get (url, params) {
    return this.request({ method: 'get', url, payload: params })
  }

  post (url, payload) {
    return this.request({ method: 'post', url, payload })
  }

  request (config) {
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
        // If the selected endpoint is not available, repeat the request with another one.
        return this.request(config)
      }
      throw error
    })
  }

  _getRandomEndpoint () {
    const onlineEndpoints = this._endpoints.filter(x => x.online)
    const endpoint = onlineEndpoints[Math.floor(Math.random() * onlineEndpoints.length)]
    return endpoint
  }

  _getFastestEndpoint () {
    return this._endpoints.reduce((fastest, current) => {
      return (current.online && (!fastest || fastest.ping > current.ping)) ? current : fastest
    })
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

const apiClient = new ApiClient(endpoints)

export default apiClient
