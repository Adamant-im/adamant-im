import { NodeType } from '@/lib/nodes/types'
import { getNodeHealthcheckConfig } from './getHealthcheckConfig'

/**
 * Allowed height delta for the nodes.
 *
 * If two nodes' heights differ by no more than this value,
 * they are considered to be in sync with each other.
 */
function getHeightEpsilon(nodeType: NodeType): number {
  const config = getNodeHealthcheckConfig(nodeType)

  return config.threshold
}

interface Node {
  height: number
}

type GroupNodes<N extends Node> = {
  height: number
  nodes: N[]
}

/**
 * Basic idea is the following: we look for the biggest group of nodes that have the same
 * height (considering HEIGHT_EPSILON). These nodes are considered to be in sync with the network,
 * all the others are not.
 */
export function filterSyncedNodes<N extends Node>(nodes: N[], type: NodeType): GroupNodes<N> {
  if (nodes.length === 0) {
    return {
      height: 0,
      nodes: []
    }
  }

  const heightEpsilon = getHeightEpsilon(type)

  // For each node we take its height and list of nodes that have the same height ± epsilon
  const groups = nodes.map((node) => {
    return {
      /** In case of "win" this height will be considered to be real height of the network */
      height: node.height,
      /** List of nodes with the same (or close) height, including current one */
      nodes: nodes.filter((x) => Math.abs(node.height - x.height) <= heightEpsilon)
    }
  })

  /** A group with the longest same-height nodes list wins.
   * If two groups have the same number of nodes,
   * the one with the biggest height wins.
   * */
  const winner = groups.reduce((acc, curr) => {
    if (curr.height > acc.height || curr.nodes.length > acc.nodes.length) {
      return curr
    }

    return acc
  })

  return winner
}
