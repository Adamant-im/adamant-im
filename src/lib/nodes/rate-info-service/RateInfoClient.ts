import { Client } from '@/lib/nodes/abstract.client.ts'
import { RateInfoResponse, RateInfoService } from '@/lib/nodes/rate-info-service/RateInfoService.ts'

export class RateInfoClient extends Client<RateInfoService> {
  constructor(endpoints: string[] = [], minNodeVersion = '0.0.0') {
    super('adm')
    this.nodes = endpoints.map((endpoint) => new RateInfoService(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }

  async getAllRates(): Promise<RateInfoResponse> {
    const node = await this.fetchNode()
    return await node.getAllRates()
  }

  async getHistory(timestamp: number) {
    const node = await this.fetchNode()
    return await node.getHistory(timestamp)
  }

  async fetchNode() {
    const node = this.useFastest ? this.getFastestNode() : this.getRandomNode()
    if (!node) {
      // All nodes seem to be offline: let's refresh the statuses
      this.checkHealth()
      // But there's nothing we can do right now
      return Promise.reject(new Error('No online nodes at the moment'))
    }
    return node
  }
}
