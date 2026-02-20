import { describe, expect, it, vi } from 'vitest'
import { Client } from '../abstract.client'
import { NODE_LABELS } from '../constants'

type MockNode = {
  url: string
  active: boolean
  online: boolean
  outOfSync: boolean
  ping: number
  height: number
  healthcheckAttemptCount: number
  hasSupportedProtocol: boolean
  hasMinNodeVersion: () => boolean
  getStatus: () => { status: string; url: string }
  client: {
    request: () => Promise<unknown>
  }
}

class TestClient extends Client<any> {
  constructor(nodes: MockNode[]) {
    super('adm', 'node', NODE_LABELS.AdmNode)
    this.nodes = nodes
  }

  exposeUpdateSyncStatuses() {
    this.updateSyncStatuses()
  }

  exposeRequestWithRetry<T>(request: (node: MockNode) => Promise<T> | T) {
    return this.requestWithRetry(request)
  }
}

function createNode(overrides: Partial<MockNode> = {}): MockNode {
  return {
    url: 'https://node.example',
    active: true,
    online: true,
    outOfSync: false,
    ping: 10,
    height: 100,
    healthcheckAttemptCount: 0,
    hasSupportedProtocol: true,
    hasMinNodeVersion: () => true,
    getStatus: () => ({ status: 'online', url: 'https://node.example' }),
    client: {
      request: () => Promise.resolve('ok')
    },
    ...overrides
  }
}

describe('Client health-check sync thresholds', () => {
  it('does not recalculate sync statuses during initial health-check before 30% responses', () => {
    const nodeA = createNode({
      url: 'https://node-a.example',
      height: 120,
      healthcheckAttemptCount: 1
    })
    const nodeB = createNode({
      url: 'https://node-b.example',
      height: 90,
      healthcheckAttemptCount: 0,
      outOfSync: true
    })
    const nodeC = createNode({
      url: 'https://node-c.example',
      height: 90,
      healthcheckAttemptCount: 0
    })
    const nodeD = createNode({
      url: 'https://node-d.example',
      height: 90,
      healthcheckAttemptCount: 0
    })
    const client = new TestClient([nodeA, nodeB, nodeC, nodeD])

    client.exposeUpdateSyncStatuses()

    expect(nodeA.outOfSync).toBe(false)
    expect(nodeB.outOfSync).toBe(true)
    expect(nodeC.outOfSync).toBe(false)
    expect(nodeD.outOfSync).toBe(false)

    nodeB.healthcheckAttemptCount = 1
    client.exposeUpdateSyncStatuses()

    expect(nodeA.outOfSync).toBe(false)
    expect(nodeB.outOfSync).toBe(true)
  })

  it('recalculates sync statuses for subsequent checks only after 100% responses', () => {
    const nodeA = createNode({
      url: 'https://node-a.example',
      height: 120,
      healthcheckAttemptCount: 2,
      outOfSync: false
    })
    const nodeB = createNode({
      url: 'https://node-b.example',
      height: 90,
      healthcheckAttemptCount: 1,
      outOfSync: true
    })
    const nodeC = createNode({
      url: 'https://node-c.example',
      height: 90,
      healthcheckAttemptCount: 1,
      outOfSync: true
    })
    const client = new TestClient([nodeA, nodeB, nodeC])

    client.exposeUpdateSyncStatuses()

    expect(nodeA.outOfSync).toBe(false)
    expect(nodeB.outOfSync).toBe(true)
    expect(nodeC.outOfSync).toBe(true)

    nodeB.healthcheckAttemptCount = 2
    nodeC.healthcheckAttemptCount = 2
    client.exposeUpdateSyncStatuses()

    expect(nodeA.outOfSync).toBe(true)
    expect(nodeB.outOfSync).toBe(false)
    expect(nodeC.outOfSync).toBe(false)
  })
})

describe('Client request fallback', () => {
  it('switches to another node and marks failed one unavailable on network error', async () => {
    const nodeA = createNode({
      url: 'https://node-a.example',
      ping: 5
    })
    const nodeB = createNode({
      url: 'https://node-b.example',
      ping: 20
    })
    const client = new TestClient([nodeA, nodeB])
    client.useFastest = true
    client.resolve()

    const request = vi.fn(async (node: MockNode) => {
      if (node.url === 'https://node-a.example') {
        throw {
          request: {},
          code: 'ETIMEDOUT'
        }
      }

      return 'ok'
    })

    const result = await client.exposeRequestWithRetry(request)

    expect(result).toBe('ok')
    expect(nodeA.online).toBe(false)
    expect(request).toHaveBeenCalledTimes(2)
  })
})
