import { createBtcLikeClient } from '../utils/createBtcLikeClient'
import type { AxiosInstance } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'

type FetchNodeVersionResponse = {
  error: string
  result: {
    buildversion: string
  }
}

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class DashNode extends Node {
  client: AxiosInstance

  constructor(url: string) {
    super(url, 'dash', 'node', NODE_LABELS.DashNode)

    this.client = createBtcLikeClient(url)

    if (this.active) {
      void this.fetchNodeVersion()
    }

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

  private async fetchNodeVersion(): Promise<void> {
    try {
      const { data } = await this.client.post<FetchNodeVersionResponse>('/', {method:'getnetworkinfo'})
      if (data?.result.buildversion) {
        this.version = data.result.buildversion
      } else {
        console.error(data.error)
      }
    } catch (e) {
      console.error(e)
    }
  }
}
