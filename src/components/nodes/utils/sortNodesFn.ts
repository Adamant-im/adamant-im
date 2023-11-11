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
