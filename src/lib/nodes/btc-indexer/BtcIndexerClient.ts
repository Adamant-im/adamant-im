import { Client } from '../abstract.client'
import { BtcIndexer } from './BtcIndexer'

/**
 * Provides methods for calling the ADAMANT API.
 *
 * The `ApiClient` instance automatically selects an ADAMANT node to
 * send the API-requests to and switches to another node if the current one
 * is not available at the moment.
 */
export class BtcIndexerClient extends Client<BtcIndexer> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super('btc')
    this.nodes = endpoints.map((endpoint) => new BtcIndexer(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }
}
