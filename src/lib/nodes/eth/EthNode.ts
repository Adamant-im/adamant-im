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
export class EthNode extends Node<Web3Eth> {
  clientName = ''

  constructor(url: NodeInfo) {
    super(url, 'eth', 'node', NODE_LABELS.EthNode)
  }

  /**
   * Create client for main URL.
   * @returns { Web3Eth } Web3 Ethereum module instance.
   */
  protected buildClient(): Web3Eth {
    return new Web3Eth(new HttpProvider(this.url))
  }

  /**
   * Create clients for alternative IP.
   * @returns { Web3Eth } Web3 Ethereum module instance.
   */
  protected buildClientAlt(): Web3Eth {
    return new Web3Eth(new HttpProvider(this.altIp as string))
  }

  protected async checkHealth() {
    const time = Date.now()
    const client = this.preferAltIp ? this.clientAlt : this.client
    const blockNumber = await client.getBlockNumber()

    console.info({ preferAltIp: this.preferAltIp, clientAlt: this.clientAlt, client: this.client })

    return {
      height: Number(blockNumber),
      ping: Date.now() - time
    }
  }

  protected async fetchNodeVersion(): Promise<void> {
    const client = this.preferAltIp ? this.clientAlt : this.client
    const { clientName, simplifiedVersion } = formatEthVersion(await client.getNodeInfo())

    this.version = simplifiedVersion
    this.clientName = clientName
  }

  displayVersion(): string {
    return this.clientName && this.version ? `${this.clientName}/${this.version}` : ''
  }
}
