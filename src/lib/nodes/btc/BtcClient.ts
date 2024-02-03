import { BtcNode } from './BtcNode'
import { Client } from '../abstract.client'

/**
 * Provides methods for calling the ADAMANT API.
 *
 * The `ApiClient` instance automatically selects an ADAMANT node to
 * send the API-requests to and switches to another node if the current one
 * is not available at the moment.
 */
export class BtcClient extends Client<BtcNode> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super('btc')
    this.nodes = endpoints.map((endpoint) => new BtcNode(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }
}
