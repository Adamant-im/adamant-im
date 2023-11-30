import { LskNode } from './LskNode'
import { Client } from '../abstract.client'

export class LskClient extends Client<LskNode> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super('lsk')
    this.nodes = endpoints.map((endpoint) => new LskNode(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }
}
