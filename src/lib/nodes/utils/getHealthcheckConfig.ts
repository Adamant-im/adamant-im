import config from '@/config'
import { HealthcheckInterval, NodeKind, NodeType } from '@/lib/nodes/types'
import type { NodeHealthcheck, ServiceHealthcheck } from '@/types/wallets'

export function getNodeHealthcheckConfig(nodeType: NodeType): NodeHealthcheck {
  return config[nodeType].nodes.healthCheck
}

export function getServiceHealthcheckConfig(nodeType: NodeType): ServiceHealthcheck {
  if (nodeType === 'eth') {
    return config[nodeType].nodes.healthCheck // Workaround: there no configuration for ETH services
  }

  return config[nodeType].services.healthCheck
}

export function getHealthCheckInterval(
  nodeType: NodeType,
  nodeKind: NodeKind,
  interval: HealthcheckInterval
) {
  const config =
    nodeKind === 'service'
      ? getServiceHealthcheckConfig(nodeType)
      : getNodeHealthcheckConfig(nodeType)

  switch (interval) {
    case 'normal':
      return config.normalUpdateInterval
    case 'crucial':
      return config.crucialUpdateInterval
    case 'onScreen':
      return config.onScreenUpdateInterval
    default:
      throw new Error(
        `getNodeHealthCheckInterval: Interval ${interval} is not defined in the Node's config`
      )
  }
}
