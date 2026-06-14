import { describe, expect, it } from 'vitest'
import config from '@/config'
import { NODE_LABELS, type TNodeLabel } from '@/lib/nodes/constants'
import { filterSyncedNodes } from './filterSyncedNodes'
import {
  getNodeHealthcheckConfig,
  getNodeSyncThreshold,
  resolveServiceSyncThreshold
} from './getHealthcheckConfig'

describe('node sync thresholds', () => {
  it('uses a service threshold when adamant-wallets defines one', () => {
    expect(resolveServiceSyncThreshold({ threshold: 7 }, { threshold: 5 })).toBe(7)
  })

  it('falls back to the blockchain node threshold when the service omits it', () => {
    expect(resolveServiceSyncThreshold({}, { threshold: 5 })).toBe(5)
  })

  it.each<[TNodeLabel, number]>([
    [NODE_LABELS.AdmNode, config.adm.nodes.healthCheck.threshold],
    [NODE_LABELS.EthNode, config.eth.nodes.healthCheck.threshold],
    [
      NODE_LABELS.EthIndexer,
      resolveServiceSyncThreshold(
        config.eth.services.ethIndexer.healthCheck,
        config.eth.nodes.healthCheck
      )
    ],
    [NODE_LABELS.BtcNode, config.btc.nodes.healthCheck.threshold],
    [
      NODE_LABELS.BtcIndexer,
      resolveServiceSyncThreshold(
        config.btc.services.btcIndexer.healthCheck,
        config.btc.nodes.healthCheck
      )
    ],
    [NODE_LABELS.DogeNode, config.doge.nodes.healthCheck.threshold],
    [
      NODE_LABELS.DogeIndexer,
      resolveServiceSyncThreshold(
        config.doge.services.dogeIndexer.healthCheck,
        config.doge.nodes.healthCheck
      )
    ],
    [NODE_LABELS.DashNode, config.dash.nodes.healthCheck.threshold],
    [
      NODE_LABELS.IpfsNode,
      resolveServiceSyncThreshold(
        config.adm.services.ipfsNode.healthCheck,
        config.adm.nodes.healthCheck
      )
    ],
    [
      NODE_LABELS.RatesInfo,
      resolveServiceSyncThreshold(
        config.adm.services.infoService.healthCheck,
        config.adm.nodes.healthCheck
      )
    ]
  ])('uses the effective configured threshold for %s', (label, threshold) => {
    expect(getNodeSyncThreshold(label)).toBe(threshold)
  })

  it('marks lagging ETH indexers out of sync using the ETH blockchain threshold', () => {
    const nodes = [
      { url: 'https://ethnode2.adamant.im', height: 25_314_346 },
      { url: 'https://ethnode2.bbry.org', height: 25_314_346 },
      { url: 'https://ethnode3.adamant.im', height: 25_315_031 },
      { url: 'https://ethnode3.bbry.org', height: 25_315_031 }
    ]

    const result = filterSyncedNodes(nodes, NODE_LABELS.EthIndexer)

    expect(result.nodes.map((node) => node.url)).toEqual([
      'https://ethnode3.adamant.im',
      'https://ethnode3.bbry.org'
    ])
  })

  it('prefers the largest synchronized group over a single node at a higher height', () => {
    const nodes = [
      { url: 'https://node1.example', height: 25_315_031 },
      { url: 'https://node2.example', height: 25_315_031 },
      { url: 'https://node3.example', height: 25_315_031 },
      { url: 'https://node4.example', height: 25_315_100 }
    ]

    const result = filterSyncedNodes(nodes, NODE_LABELS.EthIndexer)

    expect(result.nodes.map((node) => node.url)).toEqual([
      'https://node1.example',
      'https://node2.example',
      'https://node3.example'
    ])
  })

  it('uses service-specific healthcheck intervals for every indexer', () => {
    expect(getNodeHealthcheckConfig(NODE_LABELS.EthIndexer)).toBe(
      config.eth.services.ethIndexer.healthCheck
    )
    expect(getNodeHealthcheckConfig(NODE_LABELS.BtcIndexer)).toBe(
      config.btc.services.btcIndexer.healthCheck
    )
    expect(getNodeHealthcheckConfig(NODE_LABELS.DogeIndexer)).toBe(
      config.doge.services.dogeIndexer.healthCheck
    )
  })
})
