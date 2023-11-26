import { createBtcLikeClient } from '../utils/createBtcLikeClient'
import type { AxiosInstance } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class DashNode extends Node {
  client: AxiosInstance

  constructor(url: string) {
    super(url, NODE_LABELS.DashNode)

    this.client = createBtcLikeClient(url)

    void this.startHealthcheck()
  }

  protected async checkHealth() {
    const time = Date.now()
    const height = await this.client
      .post('/', {
        method: 'getblockchaininfo'
      })
      .then((res) => res.data.result.blocks)

    return {
      height,
      ping: Date.now() - time
    }
  }
}
