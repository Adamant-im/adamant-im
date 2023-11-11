import { EthNode } from './EthNode'
import { Client } from '../abstract.client'

/**
 * Provides methods for calling the ADAMANT API.
 *
 * The `ApiClient` instance automatically selects an ADAMANT node to
 * send the API-requests to and switches to another node if the current one
 * is not available at the moment.
 */
export class EthClient extends Client<EthNode> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super()
    this.nodes = endpoints.map((endpoint) => new EthNode(endpoint))
    this.minNodeVersion = minNodeVersion
    this.useFastest = false

    void this.watchNodeStatusChange()
  }
}
