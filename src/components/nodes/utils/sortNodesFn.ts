import { NodeStatusResult } from '@/lib/nodes/abstract.node'

/**
 * Sort nodes alphabetically by URL.
 * HTTPS nodes have a priority over HTTP nodes (will be placed above)
 * @param left
 * @param right
 */
export function sortNodesFn(left: NodeStatusResult, right: NodeStatusResult) {
  if (/^http:\/\//.test(left.url) || /^http:\/\//.test(right.url)) {
    return left.url > right.url ? -1 : right.url > left.url ? 1 : 0
  }

  return left.url > right.url ? 1 : right.url > left.url ? -1 : 0
}

/**
 * Group nodes by node label and sort them alphabetically by URL.
 */
export function sortCoinNodesFn(left: NodeStatusResult, right: NodeStatusResult) {
  if (left.label !== right.label) {
    return left.label > right.label ? 1 : -1
  }

  return sortNodesFn(left, right)
}
