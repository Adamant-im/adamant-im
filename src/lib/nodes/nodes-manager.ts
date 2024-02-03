import type { HealthcheckInterval } from './types'
import { nodes } from './nodes'

class NodesManager {
  updateHealthcheckInterval(interval: HealthcheckInterval) {
    for (const node of Object.values(nodes)) {
      node.updateHealthCheckInterval(interval)
    }
  }
}

export const nodesManager = new NodesManager()
