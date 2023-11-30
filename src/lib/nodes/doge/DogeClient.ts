import { DogeNode } from './DogeNode'
import { Client } from '../abstract.client'

export class DogeClient extends Client<DogeNode> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super('doge')
    this.nodes = endpoints.map((endpoint) => new DogeNode(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }
}
