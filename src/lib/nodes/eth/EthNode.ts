import Web3Eth from 'web3-eth'
import { HttpProvider } from 'web3-providers-http'
import { Node } from '@/lib/nodes/abstract.node'
import { NODE_LABELS } from '@/lib/nodes/constants'
import { formatEthVersion } from '@/lib/nodes/utils/nodeVersionFormatters'
import type { NodeInfo } from '@/types/wallets'

/**
 * Encapsulates a node. Provides methods to send API-requests
 * to the node and verify is status (online/offline, version, ping, etc.)
 */
export class EthNode extends Node<{ altIp: Web3Eth; url: Web3Eth }> {
  clientName = ''

  constructor(url: NodeInfo) {
    super(url, 'eth', 'node', NODE_LABELS.EthNode)
  }

  /**
   * Create 2 clients in advance once.
   * @returns { Web3Eth } Web3 Ethereum module instance.
   */
  protected buildClient(): { altIp: Web3Eth; url: Web3Eth } {
    const baseURL = this.preferAltIp ? this.altIp : this.url

    console.info({ baseURL, altIp: this.altIp, url: this.url })

    return {
      altIp: new Web3Eth(new HttpProvider(this.altIp as string)),
      url: new Web3Eth(new HttpProvider(this.url))
    }
  }

  protected async checkHealth() {
    const time = Date.now()
    const client = this.preferAltIp ? this.client.altIp : this.client.url
    const blockNumber = await client.getBlockNumber()

    return {
      height: Number(blockNumber),
      ping: Date.now() - time
    }
  }

  protected async fetchNodeVersion(): Promise<void> {
    const client = this.preferAltIp ? this.client.altIp : this.client.url
    const { clientName, simplifiedVersion } = formatEthVersion(await client.getNodeInfo())

    this.version = simplifiedVersion
    this.clientName = clientName
  }

  displayVersion(): string {
    return this.clientName && this.version ? `${this.clientName}/${this.version}` : ''
  }
}
