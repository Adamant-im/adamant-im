import config from '@/config'
import { TNodeLabel } from '@/lib/nodes/constants'
import type { NodeHealthcheck, ServiceHealthcheck } from '@/types/wallets'

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
    case 'eth-indexer':
      return config.eth.nodes.healthCheck.threshold
    case 'btc-node':
    case 'btc-indexer':
      return config.btc.nodes.healthCheck.threshold
    case 'doge-node':
    case 'doge-indexer':
      return config.doge.nodes.healthCheck.threshold
    case 'dash-node':
      return config.dash.nodes.healthCheck.threshold
    case 'ipfs-node':
      return config.adm.services.ipfsNode.healthCheck.threshold
    case 'rates-info':
      return config.adm.services.infoService.healthCheck.threshold
    default:
      throw new Error(`No sync threshold configuration found for ${nodeLabel}`)
  }
}
