import { createBtcLikeClient } from '../utils/createBtcLikeClient'
import type { AxiosInstance } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { formatDogeVersion } from '@/lib/nodes/utils/nodeVersionFormatters.ts'

type FetchBtcNodeInfoResult = {
  info: {
    version: number
  }
}

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class DogeNode extends Node {
  client: AxiosInstance

  constructor(url: string) {
    super(url, 'doge', 'node', NODE_LABELS.DogeNode)

    this.client = createBtcLikeClient(url)

    if (this.active) {
      void this.fetchNodeVersion()
    }

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

  private async fetchNodeVersion(): Promise<void> {
    const { data } = await this.client.get<FetchBtcNodeInfoResult>('/api/status')
    if (data.info.version) {
      this.version = formatDogeVersion(data.info.version)
    }
  }
}
