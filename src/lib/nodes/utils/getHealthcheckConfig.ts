import config from '@/config'
import { TNodeLabel } from '@/lib/nodes/constants'
import type { NodeHealthcheck, ServiceHealthcheck } from '@/types/wallets'

type OptionalSyncThresholdConfig = {
  threshold?: number
}

type SyncThresholdConfig = {
  threshold: number
}

export function resolveServiceSyncThreshold(
  serviceConfig: OptionalSyncThresholdConfig,
  nodeConfig: SyncThresholdConfig
): number {
  return serviceConfig.threshold ?? nodeConfig.threshold
}

export function getNodeHealthcheckConfig(
  nodeLabel: TNodeLabel
): NodeHealthcheck | ServiceHealthcheck {
  switch (nodeLabel) {
    case 'adm-node':
      return config.adm.nodes.healthCheck
    case 'eth-node':
      return config.eth.nodes.healthCheck
    case 'eth-indexer':
      return config.eth.services.ethIndexer.healthCheck
    case 'btc-node':
      return config.btc.nodes.healthCheck
    case 'btc-indexer':
      return config.btc.services.btcIndexer.healthCheck
    case 'doge-node':
      return config.doge.nodes.healthCheck
    case 'doge-indexer':
      return config.doge.services.dogeIndexer.healthCheck
    case 'dash-node':
      return config.dash.nodes.healthCheck
    case 'ipfs-node':
      return config.adm.services.ipfsNode.healthCheck
    case 'rates-info':
      return config.adm.services.infoService.healthCheck
    default:
      throw new Error(`No healthcheck configuration found for ${nodeLabel}`)
  }
}

export function getNodeSyncThreshold(nodeLabel: TNodeLabel): number {
  switch (nodeLabel) {
    case 'adm-node':
      return config.adm.nodes.healthCheck.threshold
    case 'eth-node':
      return config.eth.nodes.healthCheck.threshold
    case 'eth-indexer':
      return resolveServiceSyncThreshold(
        config.eth.services.ethIndexer.healthCheck,
        config.eth.nodes.healthCheck
      )
    case 'btc-node':
      return config.btc.nodes.healthCheck.threshold
    case 'btc-indexer':
      return resolveServiceSyncThreshold(
        config.btc.services.btcIndexer.healthCheck,
        config.btc.nodes.healthCheck
      )
    case 'doge-node':
      return config.doge.nodes.healthCheck.threshold
    case 'doge-indexer':
      return resolveServiceSyncThreshold(
        config.doge.services.dogeIndexer.healthCheck,
        config.doge.nodes.healthCheck
      )
    case 'dash-node':
      return config.dash.nodes.healthCheck.threshold
    case 'ipfs-node':
      return resolveServiceSyncThreshold(
        config.adm.services.ipfsNode.healthCheck,
        config.adm.nodes.healthCheck
      )
    case 'rates-info':
      return resolveServiceSyncThreshold(
        config.adm.services.infoService.healthCheck,
        config.adm.nodes.healthCheck
      )
    default:
      throw new Error(`No sync threshold configuration found for ${nodeLabel}`)
  }
}
