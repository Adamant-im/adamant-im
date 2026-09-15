// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  NETWORK_CONFIG_VARIANTS,
  getNetworkOverrideKey,
  mergeNetworkOverride,
  resolveCoinNetworkConfig,
  resolveNetworkConfig
} from './networkConfig.mjs'
import { NETWORK_CONFIG_VARIANTS as BUNDLED_NETWORK_CONFIG_VARIANTS } from '../../vite-config/plugins/networkConfigPlugin.ts'

const healthCheck = {
  normalUpdateInterval: 300000,
  crucialUpdateInterval: 30000,
  onScreenUpdateInterval: 10000,
  threshold: 10
}

function createAdmMetadata() {
  return {
    symbol: 'ADM',
    website: 'https://website.mainnet.example',
    explorer: 'https://explorer.mainnet.example',
    explorerTx: 'https://explorer.mainnet.example/tx/${ID}',
    explorerAddress: 'https://explorer.mainnet.example/address/${ID}',
    nodes: {
      displayName: 'adm-node',
      list: [
        { url: 'https://node1.mainnet.example', alt_ip: 'http://192.0.2.1:36666' },
        { url: 'https://node2.mainnet.example', alt_ip: 'http://192.0.2.2:36666' },
        { url: 'https://node3.mainnet.example' }
      ],
      healthCheck,
      minVersion: '0.8.0',
      nodeTimeCorrection: 500
    },
    services: {
      infoService: {
        displayName: 'rates-info',
        list: [{ url: 'https://info.mainnet.example' }],
        healthCheck
      },
      ipfsNode: {
        displayName: 'ipfs-node',
        list: [
          { url: 'https://ipfs1.mainnet.example', alt_ip: 'http://192.0.2.10:44099' },
          { url: 'https://ipfs2.mainnet.example' }
        ],
        healthCheck
      }
    },
    links: [{ name: 'github', url: 'https://github.example' }],
    testnet: {
      website: 'https://website.testnet.example',
      explorer: 'https://explorer.testnet.example',
      explorerTx: 'https://explorer.testnet.example/tx/${ID}',
      explorerAddress: 'https://explorer.testnet.example/address/${ID}',
      nodes: {
        list: [{ url: 'https://node1.testnet.example' }],
        minVersion: '0.9.0'
      },
      services: {
        ipfsNode: {
          list: [{ url: 'https://ipfs1.testnet.example' }, { url: 'https://ipfs2.testnet.example' }]
        }
      }
    },
    tor: {
      website: 'http://website.onion',
      explorer: 'http://explorer.onion',
      nodes: {
        list: [{ url: 'http://node1.onion' }]
      },
      services: {
        infoService: { list: [{ url: 'http://info.onion' }] },
        ipfsNode: { list: [{ url: 'http://ipfs.onion' }] }
      }
    }
  }
}

function createBtcMetadata() {
  return {
    symbol: 'BTC',
    explorer: 'https://btc-explorer.example',
    explorerTx: 'https://btc-explorer.example/tx/${ID}',
    explorerAddress: 'https://btc-explorer.example/address/${ID}',
    nodes: {
      displayName: 'btc-node',
      list: [{ url: 'https://btc-node.example' }],
      healthCheck
    },
    tor: {
      nodes: {
        displayName: 'btc-node',
        list: [{ url: 'http://btc-node.onion' }],
        healthCheck
      }
    }
  }
}

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }

  return value
}

describe('resolveCoinNetworkConfig', () => {
  it('applies every field of the testnet override', () => {
    expect(resolveCoinNetworkConfig(createAdmMetadata(), 'testnet')).toEqual({
      explorer: 'https://explorer.testnet.example',
      explorerTx: 'https://explorer.testnet.example/tx/${ID}',
      explorerAddress: 'https://explorer.testnet.example/address/${ID}',
      nodes: {
        displayName: 'adm-node',
        list: [{ url: 'https://node1.testnet.example' }],
        healthCheck,
        minVersion: '0.9.0',
        nodeTimeCorrection: 500
      },
      services: {
        infoService: {
          displayName: 'rates-info',
          list: [{ url: 'https://info.mainnet.example' }],
          healthCheck
        },
        ipfsNode: {
          displayName: 'ipfs-node',
          list: [
            { url: 'https://ipfs1.testnet.example' },
            { url: 'https://ipfs2.testnet.example' }
          ],
          healthCheck
        }
      }
    })
  })

  it('applies the Tor override without testnet values', () => {
    const config = resolveCoinNetworkConfig(createAdmMetadata(), 'tor')

    expect(config.explorer).toBe('http://explorer.onion')
    expect(config.explorerTx).toBe('https://explorer.mainnet.example/tx/${ID}')
    expect(config.nodes).toEqual({
      displayName: 'adm-node',
      list: [{ url: 'http://node1.onion' }],
      healthCheck,
      minVersion: '0.8.0',
      nodeTimeCorrection: 500
    })
    expect(config.services.infoService.list).toEqual([{ url: 'http://info.onion' }])
    expect(config.services.ipfsNode.list).toEqual([{ url: 'http://ipfs.onion' }])
  })

  it('uses base network fields for mainnet', () => {
    const metadata = createAdmMetadata()

    expect(resolveCoinNetworkConfig(metadata, 'mainnet')).toEqual({
      explorer: metadata.explorer,
      explorerTx: metadata.explorerTx,
      explorerAddress: metadata.explorerAddress,
      nodes: metadata.nodes,
      services: metadata.services
    })
  })

  it('replaces endpoint arrays instead of merging them by index', () => {
    const config = resolveCoinNetworkConfig(createAdmMetadata(), 'testnet')

    expect(config.nodes.list).toEqual([{ url: 'https://node1.testnet.example' }])
    expect(
      mergeNetworkOverride(
        {
          list: [
            { url: 'https://a.example', alt_ip: 'http://192.0.2.1' },
            { url: 'https://b.example' }
          ]
        },
        { list: [{ url: 'https://c.example' }] }
      )
    ).toEqual({ list: [{ url: 'https://c.example' }] })
  })

  it('keeps coins without the selected override on base metadata', () => {
    const metadata = createBtcMetadata()

    expect(resolveCoinNetworkConfig(metadata, 'testnet')).toEqual(
      resolveCoinNetworkConfig(metadata, 'mainnet')
    )
  })

  it('writes only network fields in a stable order', () => {
    const config = resolveCoinNetworkConfig(createAdmMetadata(), 'tor')

    expect(Object.keys(config)).toEqual([
      'explorer',
      'explorerTx',
      'explorerAddress',
      'nodes',
      'services'
    ])
  })

  it('rejects a malformed override', () => {
    expect(() =>
      resolveCoinNetworkConfig(
        { ...createBtcMetadata(), tor: [{ url: 'http://node.onion' }] },
        'tor'
      )
    ).toThrow('Invalid "tor" override for BTC')
  })
})

describe('resolveNetworkConfig', () => {
  it('does not mutate source metadata', () => {
    const coins = { adm: createAdmMetadata(), btc: createBtcMetadata() }
    const snapshot = structuredClone(coins)
    deepFreeze(coins)

    const resolved = Object.keys(NETWORK_CONFIG_VARIANTS).map((variant) =>
      resolveNetworkConfig(coins, variant)
    )

    expect(coins).toEqual(snapshot)

    resolved[0].adm.nodes.list.push({ url: 'https://mutated.example' })
    resolved[0].adm.services.ipfsNode.healthCheck.threshold = 1

    expect(coins).toEqual(snapshot)
  })

  it('resolves variants independently of resolution order', () => {
    const coins = { adm: createAdmMetadata(), btc: createBtcMetadata() }
    const torFirst = resolveNetworkConfig(coins, 'tor')
    const mainnetFirst = resolveNetworkConfig(coins, 'mainnet')

    resolveNetworkConfig(coins, 'testnet')

    expect(resolveNetworkConfig(coins, 'tor')).toEqual(torFirst)
    expect(resolveNetworkConfig(coins, 'mainnet')).toEqual(mainnetFirst)
  })

  it('sorts coins by key', () => {
    const coins = { eth: createBtcMetadata(), adm: createAdmMetadata(), btc: createBtcMetadata() }

    expect(Object.keys(resolveNetworkConfig(coins, 'mainnet'))).toEqual(['adm', 'btc', 'eth'])
  })
})

describe('getNetworkOverrideKey', () => {
  it.each([
    ['mainnet', null],
    ['testnet', 'testnet'],
    ['tor', 'tor']
  ])('supports the %s variant', (variant, overrideKey) => {
    expect(getNetworkOverrideKey(variant)).toBe(overrideKey)
  })

  it('generates every variant that builds can bundle', () => {
    expect(Object.keys(NETWORK_CONFIG_VARIANTS)).toEqual([...BUNDLED_NETWORK_CONFIG_VARIANTS])
  })

  it('rejects tor-testnet explicitly', () => {
    expect(() => resolveNetworkConfig({ adm: createAdmMetadata() }, 'tor-testnet')).toThrow(
      'cannot be combined with "testnet"'
    )
  })

  it.each([
    'development',
    'production',
    'staging',
    'tor-dev',
    'test',
    '',
    'constructor',
    '__proto__'
  ])('rejects the unknown variant %j', (variant) => {
    expect(() => getNetworkOverrideKey(variant)).toThrow(
      'Unsupported network configuration variant'
    )
  })
})

describe('mergeNetworkOverride', () => {
  it('does not let metadata keys replace object prototypes', () => {
    const merged = mergeNetworkOverride({}, JSON.parse('{"__proto__": {"polluted": true}}'))

    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype)
    expect(Object.hasOwn(merged, '__proto__')).toBe(true)
    expect({}.polluted).toBeUndefined()
  })
})
