import { DashNode } from './DashNode'
import { Client } from '../abstract.client'

export class DashClient extends Client<DashNode> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super('dash')
    this.nodes = endpoints.map((endpoint) => new DashNode(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }
}
