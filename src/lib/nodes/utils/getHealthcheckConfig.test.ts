import { describe, expect, it } from 'vitest'
import config from '@/config'
import { NODE_LABELS, type TNodeLabel } from '@/lib/nodes/constants'
import { filterSyncedNodes } from './filterSyncedNodes'
import { getNodeHealthcheckConfig, getNodeSyncThreshold } from './getHealthcheckConfig'

describe('node sync thresholds', () => {
  it.each<[TNodeLabel, number]>([
    [NODE_LABELS.AdmNode, 10],
    [NODE_LABELS.EthNode, 5],
    [NODE_LABELS.EthIndexer, 5],
    [NODE_LABELS.BtcNode, 2],
    [NODE_LABELS.BtcIndexer, 2],
    [NODE_LABELS.DogeNode, 3],
    [NODE_LABELS.DogeIndexer, 3],
    [NODE_LABELS.DashNode, 3],
    [NODE_LABELS.IpfsNode, 6_000_000],
    [NODE_LABELS.RatesInfo, 6_000_000]
  ])('uses the configured blockchain threshold for %s', (label, threshold) => {
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
