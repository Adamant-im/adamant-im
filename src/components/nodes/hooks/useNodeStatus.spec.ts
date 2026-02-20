import { describe, expect, it } from 'vitest'
import type { NodeStatusResult } from '@/lib/nodes/abstract.node'
import { getNodeStatusColor, getNodeStatusDetail, getNodeStatusTitle } from './useNodeStatus'

const t = (key: string) => {
  const messages: Record<string, string> = {
    'nodes.offline': 'Offline',
    'nodes.unsupported': 'Unsupported',
    'nodes.inactive': 'Inactive',
    'nodes.unsupported_reason_protocol': 'HTTP not supported',
    'nodes.unsupported_reason_api_version': 'Outdated API version'
  }

  return messages[key] ?? key
}

const createNode = (overrides: Partial<NodeStatusResult> = {}): NodeStatusResult =>
  ({
    alt_ip: 'http://95.216.114.252:44099',
    url: 'https://example.adamant.im',
    port: '44099',
    hostname: 'example.adamant.im',
    protocol: 'https:',
    wsProtocol: 'wss:',
    wsPort: '36668',
    wsPortNeeded: false,
    online: false,
    ping: Infinity,
    version: '0.0.0',
    active: true,
    outOfSync: false,
    hasMinNodeVersion: true,
    displayVersion: '',
    hasSupportedProtocol: false,
    socketSupport: false,
    height: 0,
    status: 'offline',
    type: 'adm',
    label: 'ADAMANT Node',
    formattedHeight: '0',
    ...overrides
  }) as NodeStatusResult

describe('useNodeStatus helpers', () => {
  it('shows Offline title for unavailable-by-timeout nodes', () => {
    const node = createNode({
      online: false,
      hasSupportedProtocol: true,
      status: 'offline'
    })

    expect(getNodeStatusTitle(node, t as any)).toBe('Offline')
  })

  it('shows Unsupported title when protocol is not supported', () => {
    const node = createNode({
      online: false,
      hasSupportedProtocol: false,
      status: 'offline'
    })

    expect(getNodeStatusTitle(node, t as any)).toBe('Unsupported')
  })

  it('shows protocol reason when HTTP node is unsupported on HTTPS app', () => {
    const node = createNode({
      online: false,
      hasSupportedProtocol: false,
      status: 'offline'
    })

    expect(getNodeStatusDetail(node, t as any)).toEqual({
      text: 'HTTP not supported'
    })
  })

  it('keeps offline color for unavailable nodes', () => {
    const node = createNode({ status: 'offline' })

    expect(getNodeStatusColor(node)).toBe('red')
  })
})
