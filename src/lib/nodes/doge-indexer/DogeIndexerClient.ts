import { DogeIndexer } from './DogeIndexer'
import { Client } from '../abstract.client'

export class DogeIndexerClient extends Client<DogeIndexer> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super('doge')
    this.nodes = endpoints.map((endpoint) => new DogeIndexer(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }
}
