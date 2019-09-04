import io from 'socket.io-client'
import random from 'lodash/random'

import config from '@/config'

export class SocketClient {
  /**
   * @param {string[]} nodes Array of nodes URLs
   */
  constructor (nodes) {
    this.nodes = nodes
  }

  /**
   * Get random socket address.
   * @returns {string}
   */
  get socketAddress () {
    return this.nodes[random(this.nodes.length - 1)]
  }

  on (event, fn) {
    this.connection.on(event, fn)
  }

  connect (adamantAddress) {
    this.connection = io(this.socketAddress, { reconnection: false, timeout: 5000 })

    this.connection.on('connect', () => {
      this.connection.emit('msg', adamantAddress + ' connected!')
      this.connection.emit('address', adamantAddress)
    })

    this.connection.on('disconnect', reason => {
      if (reason === 'ping timeout' || reason === 'io server disconnect') {
        this.connect(adamantAddress)
      }
    })

    this.connection.on('connect_error', (err) => {
      console.warn('connect_error', err)
      setTimeout(() => this.connect(adamantAddress), 5000)
    })
  }

  disconnect () {
    this.connection && this.connection.close()
  }
}

const nodes = config.server.adm.map(node => node.url.replace(/^https?:\/\/(.*)$/, 'wss://$1'))

export default new SocketClient(nodes)
