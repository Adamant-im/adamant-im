import type { HealthcheckInterval } from './types'
import { nodes } from './nodes'
import { services } from './services'

class NodesManager {
  updateHealthcheckInterval(interval: HealthcheckInterval) {
    for (const node of Object.values(nodes)) {
      node.updateHealthCheckInterval(interval)
    }
    for (const service of Object.values(services)) {
      service.updateHealthCheckInterval(interval)
    }
  }
}

export const nodesManager = new NodesManager()
