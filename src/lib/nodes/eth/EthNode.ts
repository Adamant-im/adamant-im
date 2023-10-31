import Web3Eth from 'web3-eth'
import { HttpProvider } from './HttpProvider'
import { Node } from '@/lib/nodes/abstract.node'

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
    super(url)

    this.provider = new HttpProvider(this.url)
    this.client = new Web3Eth(this.provider)

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
}
