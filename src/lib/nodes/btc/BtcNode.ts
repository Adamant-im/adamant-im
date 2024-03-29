import { createBtcLikeClient } from '../utils/createBtcLikeClient'
import type { AxiosInstance } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { formatBtcVersion } from '@/lib/nodes/utils/nodeVersionFormatters.ts'

type FetchBtcNodeInfoResult = {
  error: string
  result: {
    version: number
  }
}

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class BtcNode extends Node<AxiosInstance> {
  constructor(url: string) {
    super(url, 'btc', 'node', NODE_LABELS.BtcNode)
  }

  protected buildClient(): AxiosInstance {
    return createBtcLikeClient(this.url)
  }

  protected async checkHealth() {
    const time = Date.now()
    const blockNumber = await this.client.get('/blocks/tip/height').then((res) => {
      return Number(res.data) || 0
    })

    return {
      height: Number(blockNumber),
      ping: Date.now() - time
    }
  }

  protected async fetchNodeVersion(): Promise<void> {
    const { data } = await this.client.post<FetchBtcNodeInfoResult>('/bitcoind', {
      jsonrpc: '1.0',
      id: 'adm',
      method: 'getnetworkinfo',
      params: []
    })
    const { version } = data.result
    if (version) {
      this.version = formatBtcVersion(version)
    }
  }
}
