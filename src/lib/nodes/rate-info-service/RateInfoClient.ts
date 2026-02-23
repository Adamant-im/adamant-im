import { NODE_LABELS } from '@/lib/nodes/constants'
import { Client } from '@/lib/nodes/abstract.client'
import { RateInfoService } from '@/lib/nodes/rate-info-service/RateInfoService'
import { RateInfoResponse } from '@/lib/nodes/rate-info-service/types/RateInfoResponse'
import type { NodeInfo } from '@/types/wallets'

export class RateInfoClient extends Client<RateInfoService> {
  constructor(endpoints: NodeInfo[] = [], minNodeVersion = '0.0.0') {
    super('adm', 'service', NODE_LABELS.RatesInfo)
    this.nodes = endpoints.map((endpoint) => new RateInfoService(endpoint))
    this.minNodeVersion = minNodeVersion

    void this.watchNodeStatusChange()
  }

  async getAllRates(): Promise<RateInfoResponse> {
    return this.requestWithRetry((node) => node.getAllRates())
  }

  async getHistory(timestamp: number) {
    return this.requestWithRetry((node) => node.getHistory({ timestamp }))
  }
}
