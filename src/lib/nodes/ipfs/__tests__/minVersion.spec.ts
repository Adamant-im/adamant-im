import type { IpfsClient } from '@/lib/nodes/ipfs/IpfsClient'
import type { Node } from '@/lib/nodes/abstract.node'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * ADM node floors (`0.10.0`) and a shared `services.minVersion` must not reach IPFS.
 * The poisoned fields below are what the old `IpfsClient` wiring would have used.
 * Setup mocks `@/lib/nodes/ipfs/index` with an empty object, so this file loads the real module.
 */
const { networkConfig } = vi.hoisted(() => {
  const networkConfig = {
    adm: {
      nodes: {
        minVersion: '0.10.0',
        healthCheck: {
          normalUpdateInterval: 300000,
          crucialUpdateInterval: 30000,
          onScreenUpdateInterval: 10000,
          threshold: 10
        }
      },
      services: {
        minVersion: '0.10.0',
        ipfsNode: {
          list: [{ url: 'https://ipfs.example' }],
          healthCheck: {
            normalUpdateInterval: 300000,
            crucialUpdateInterval: 30000,
            onScreenUpdateInterval: 10000,
            threshold: 6000000
          },
          minVersion: undefined as string | undefined
        }
      }
    }
  }

  return { networkConfig }
})

vi.unmock('@/lib/nodes/ipfs/index')
vi.unmock('@/lib/nodes/ipfs')

vi.mock('@/config', () => ({
  default: networkConfig
}))

let client: IpfsClient | undefined

async function loadIpfsClient() {
  const { Node } = await import('@/lib/nodes/abstract.node')

  vi.spyOn(Node.prototype, 'startHealthcheck').mockImplementation(function (this: Node) {
    return Promise.resolve(this)
  })

  const { ipfs } = await import('../index')
  client = ipfs

  return ipfs
}

function reportVersion(node: Node, version: string) {
  node.version = version
  node.online = true
  node.active = true
}

afterEach(() => {
  for (const node of client?.nodes ?? []) {
    clearTimeout(node.timer)
  }

  client = undefined
  vi.restoreAllMocks()
  vi.resetModules()
  networkConfig.adm.services.ipfsNode.minVersion = undefined
})

describe('IpfsClient min version', () => {
  it('keeps IPFS API 0.1.0 supported when the ADM floor is 0.10.0 and ipfsNode.minVersion is unset', async () => {
    networkConfig.adm.services.ipfsNode.minVersion = undefined

    const ipfs = await loadIpfsClient()
    const node = ipfs.nodes[0]

    reportVersion(node, '0.1.0')

    expect(networkConfig.adm.nodes.minVersion).toBe('0.10.0')
    expect(networkConfig.adm.services.minVersion).toBe('0.10.0')
    expect(networkConfig.adm.services.ipfsNode.minVersion).toBeUndefined()
    expect(ipfs.minNodeVersion).toBe('0.0.0')
    expect(node.minNodeVersion).toBe('0.0.0')
    expect(node.hasMinNodeVersion()).toBe(true)
    expect(node.getNodeStatus()).toBe('online')
  })

  it('rejects an IPFS API older than ipfsNode.minVersion', async () => {
    networkConfig.adm.services.ipfsNode.minVersion = '0.2.0'

    const ipfs = await loadIpfsClient()
    const node = ipfs.nodes[0]

    reportVersion(node, '0.1.0')

    expect(ipfs.minNodeVersion).toBe('0.2.0')
    expect(node.minNodeVersion).toBe('0.2.0')
    expect(node.hasMinNodeVersion()).toBe(false)
    expect(node.getNodeStatus()).toBe('unsupported_version')
  })

  it('accepts an IPFS API that meets ipfsNode.minVersion', async () => {
    networkConfig.adm.services.ipfsNode.minVersion = '0.1.0'

    const ipfs = await loadIpfsClient()
    const node = ipfs.nodes[0]

    reportVersion(node, '0.1.0')

    expect(node.minNodeVersion).toBe('0.1.0')
    expect(node.hasMinNodeVersion()).toBe(true)
    expect(node.getNodeStatus()).toBe('online')
  })
})
