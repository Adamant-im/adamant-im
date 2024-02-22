import { createBtcLikeClient } from '../utils/createBtcLikeClient'
import type { AxiosInstance } from 'axios'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { formatBtcVersion } from '@/lib/nodes/utils/formatBtcVersion.ts'

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
export class BtcNode extends Node {
  client: AxiosInstance

  constructor(url: string) {
    super(url, 'btc', 'node', NODE_LABELS.BtcNode)

    this.client = createBtcLikeClient(url)

    if (this.active) {
      void this.fetchNodeVersion()
    }

    void this.startHealthcheck()
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

  private async fetchNodeVersion(): Promise<void> {
    try {
      const { data } = await this.client.post<FetchBtcNodeInfoResult>('/bitcoind', {"jsonrpc":"1.0","id":"adm","method":"getnetworkinfo","params":[]})
      const v =  data?.result?.version
      if (v) {
        this.version = 'v' + formatBtcVersion(v)
      } else {
        console.error(data.error)
      }
    } catch (e) {
      console.error(e)
    }
  }
}
