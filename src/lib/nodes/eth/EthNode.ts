import Web3Eth from 'web3-eth'
import { HttpProvider } from 'web3-providers-http'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { formatEthVersion } from '@/lib/nodes/utils/nodeVersionFormatters.ts'

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class EthNode extends Node {
  /**
   * @custom
   */
  provider: HttpProvider
  client: Web3Eth

  constructor(url: string) {
    super(url, 'eth', 'node', NODE_LABELS.EthNode)

    this.provider = new HttpProvider(this.url)
    this.client = new Web3Eth(this.provider)

    if (this.active) {
      void this.fetchNodeVersion()
    }

    void this.startHealthcheck()
  }

  protected async checkHealth() {
    const time = Date.now()
    const blockNumber = await this.client.getBlockNumber()

    return {
      height: Number(blockNumber),
      ping: Date.now() - time
    }
  }

  private async fetchNodeVersion(): Promise<void> {
    this.version = formatEthVersion(await this.client.getNodeInfo())
  }
}
