import { createBtcLikeClient } from '../utils/createBtcLikeClient'
import type { AxiosInstance } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class DogeNode extends Node {
  client: AxiosInstance

  constructor(url: string) {
    super(url, NODE_LABELS.DogeNode)

    this.client = createBtcLikeClient(url)

    void this.startHealthcheck()
  }

  protected async checkHealth() {
    const time = Date.now()
    const height = await this.client
      .get('/api/blocks?limit=0')
      .then((res) => res.data.blocks[0].height)

    return {
      height,
      ping: Date.now() - time
    }
  }
}
