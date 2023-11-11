import { DashNode } from './DashNode'
import { Client } from '../abstract.client'

export class DashClient extends Client<DashNode> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super()
    this.nodes = endpoints.map((endpoint) => new DashNode(endpoint))
    this.minNodeVersion = minNodeVersion
    this.useFastest = false

    void this.watchNodeStatusChange()
  }
}
