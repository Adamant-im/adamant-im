import Web3Eth from 'web3-eth'
import { HttpProvider } from 'web3-providers-http'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { formatEthVersion } from '@/lib/nodes/utils/nodeVersionFormatters'

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class EthNode extends Node<Web3Eth> {
  clientName = ''

  constructor(url: string) {
    super(url, 'eth', 'node', NODE_LABELS.EthNode)
  }

  protected buildClient(): Web3Eth {
    return new Web3Eth(new HttpProvider(this.url))
  }

  protected async checkHealth() {
    const time = Date.now()
    const blockNumber = await this.client.getBlockNumber()

    return {
      height: Number(blockNumber),
      ping: Date.now() - time
    }
  }

  protected async fetchNodeVersion(): Promise<void> {
    const { clientName, simplifiedVersion } = formatEthVersion(await this.client.getNodeInfo())
    this.version = simplifiedVersion
    this.clientName = clientName
  }

  displayVersion(): string {
    return this.clientName && this.version ? `${this.clientName}/${this.version}` : ''
  }
}
