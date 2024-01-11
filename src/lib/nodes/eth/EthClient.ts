import { EthNode } from './EthNode'
import { Client } from '../abstract.client'
import { normalizeTransaction } from './utils'

/**
 * Provides methods for calling the ADAMANT API.
 *
 * The `ApiClient` instance automatically selects an ADAMANT node to
 * send the API-requests to and switches to another node if the current one
 * is not available at the moment.
 */
export class EthClient extends Client<EthNode> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super('eth')
    this.nodes = endpoints.map((endpoint) => new EthNode(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }

  async getTransaction(hash: string) {
    const node = this.getNode()

    const transaction = await node.client.getTransaction(hash)

    return normalizeTransaction(transaction)
  }
}
