import io from 'socket.io-client'
import random from 'lodash/random'

/**
 * interface Events {
 *   [key: string]: Function[];
 * }
 */
export class EventEmitter {
  /**
   * @param {Events} events
   */
  constructor (events) {
    this.events = events || {}
  }

  /**
   * @param {string} event
   * @param {Function} cb
   */
  subscribe (event, cb) {
    (this.events[event] || (this.events[event] = [])).push(cb)

    return {
      unsubscribe: () =>
        this.events[event] && this.events[event].splice(this.events[event].indexOf(cb) >>> 0, 1)
    }
  }

  /**
   * @param {string} event
   * @param {any[]} args
   */
  emit (event, ...args) {
    (this.events[event] || []).forEach(fn => fn(...args))
  }
}

export class SocketClient extends EventEmitter {
  adamantAddress = ''
  nodes = {}

  /**
   * The current node to which we are connected
   * @type {string}
   */
  currentSocketAddress = ''

  /**
   * Set true when chat messages are loaded
   * @type {boolean}
   */
  isSocketReady = false

  /**
   * Sync with store.state.options.useSocketConnection
   * @type {boolean}
   */
  isSocketEnabled = false

  /**
   * Sync with store.state.nodes.useFastest
   * @type {boolean}
   */
  useFastest = false

  interval = null

  /**
   * @type {number}
   */
  REVISE_CONNECTION_TIMEOUT = 5000

  /**
   * Get random socket address.
   * @returns {string}
   */
  get socketAddress () {
    const node = this.useFastest
      ? this.fastestNode
      : this.randomNode

    return node.url.replace(/^https?:\/\/(.*)$/, '$1')
  }

  get fastestNode () {
    return this.nodes.reduce((fastest, current) => {
      if (!current.online || !current.active || current.outOfSync) {
        return fastest
      }
      return (!fastest || fastest.ping > current.ping) ? current : fastest
    })
  }

  get randomNode () {
    const activeNodes = this.nodes.filter(n => n.online && n.active && !n.outOfSync && n.socketSupport)

    return activeNodes[random(activeNodes.length - 1)]
  }

  get hasActiveNodes () {
    return Object.values(this.nodes)
      .some(n => n.online && n.active && !n.outOfSync && n.socketSupport)
  }

  get isOnline () {
    return this.connection && this.connection.connected
  }

  get isCurrentNodeActive () {
    return this.nodes.some(
      node => node.url.match(new RegExp(this.currentSocketAddress)) && node.active
    )
  }

  /**
   * Update nodes statuses.
   * @param nodes
   */
  setNodes (nodes) {
    this.nodes = nodes
  }

  setAdamantAddress (address) {
    this.adamantAddress = address
  }

  setSocketReady (value) {
    this.isSocketReady = value
  }

  setSocketEnabled (value) {
    this.isSocketEnabled = value

    if (!value) this.disconnect()
  }

  /**
   * @param {boolean} value
   */
  setUseFastest (value) {
    this.useFastest = value
  }

  /**
   * Subscribe to socket events.
   */
  subscribeToEvents () {
    if (this.connection) {
      this.connection.on('newTrans', transaction => {
        if (transaction.type === 0 || transaction.type === 8) this.emit('newMessage', transaction)
      })
    }
  }

  /**
   * @param address ADAMANT address
   */
  init (address) {
    this.setAdamantAddress(address)
    this.setSocketReady(true)
    this.interval = setInterval(() => this.reviseConnection(), this.REVISE_CONNECTION_TIMEOUT)
  }

  destroy () {
    clearInterval(this.interval)
    this.setSocketReady(false)
    this.disconnect()
  }

  connect (socketAddress) {
    this.connection = io(`wss://${socketAddress}`, { reconnection: false, timeout: 5000 })

    this.connection.on('connect', () => {
      this.currentSocketAddress = socketAddress
      this.connection.emit('msg', this.adamantAddress + ' connected!')
      this.connection.emit('address', this.adamantAddress)
    })

    this.connection.on('disconnect', reason => {
      if (reason === 'ping timeout' || reason === 'io server disconnect') {
        console.warn('[Socket] Disconnected. Reason:', reason)
      }
    })

    this.connection.on('connect_error', (err) => {
      console.warn('[Socket] connect_error', err)
    })
  }

  disconnect () {
    this.connection && this.connection.close()
  }

  reviseConnection () {
    if (!this.isSocketReady) return
    if (!this.isSocketEnabled) return
    if (!this.hasActiveNodes) {
      this.disconnect()
      console.warn('[Socket]: No active nodes')
      return
    }

    const socketAddress = this.socketAddress

    if (
      (
        this.isOnline &&
        this.useFastest &&
        this.currentSocketAddress !== socketAddress
      ) ||
      !this.isOnline ||
      !this.isCurrentNodeActive
    ) {
      this.disconnect()
      this.connect(socketAddress)
      this.subscribeToEvents()
    }
  }
}

export default new SocketClient()
