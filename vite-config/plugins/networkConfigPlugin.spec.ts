// @vitest-environment node

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { normalizePath } from 'vite'
import { describe, expect, it } from 'vitest'

import {
  NETWORK_CONFIG_MODULE_ID,
  NETWORK_CONFIG_VARIANTS,
  SUPPORTED_NETWORK_MODES,
  findBundledNetworkConfigViolations,
  findNetworkConfigViolations,
  networkConfigPlugin,
  resolveNetworkConfigVariant,
  type NetworkBuildTarget,
  type NetworkConfig,
  type NetworkConfigVariant
} from './networkConfigPlugin'

const mainnet: NetworkConfig = {
  adm: {
    explorer: 'https://explorer.mainnet.example',
    explorerTx: 'https://explorer.mainnet.example/tx/${ID}',
    nodes: {
      list: [{ url: 'https://adm.mainnet.example', alt_ip: 'http://192.0.2.1:36666' }]
    },
    services: {
      infoService: { list: [{ url: 'https://info.example' }] },
      ipfsNode: { list: [{ url: 'https://ipfs.mainnet.example' }] }
    }
  },
  btc: {
    explorer: 'https://btc-explorer.example',
    nodes: { list: [{ url: 'https://btc.example/bitcoind' }] }
  }
}

const testnet: NetworkConfig = {
  adm: {
    explorer: 'https://explorer.testnet.example',
    explorerTx: 'https://explorer.testnet.example/tx/${ID}',
    nodes: { list: [{ url: 'https://adm.testnet.example' }] },
    services: {
      infoService: { list: [{ url: 'https://info.example' }] },
      ipfsNode: { list: [{ url: 'https://ipfs.testnet.example' }] }
    }
  },
  btc: mainnet.btc
}

const tor: NetworkConfig = {
  adm: {
    explorer: 'http://explorer.onion',
    nodes: { list: [{ url: 'http://adm.onion' }] },
    services: {
      infoService: { list: [{ url: 'http://info.onion' }] },
      ipfsNode: { list: [{ url: 'http://ipfs.onion' }] }
    }
  },
  btc: {
    explorer: 'https://btc-explorer.example',
    explorerTx: 'https://btc-explorer.example/tx/${ID}',
    nodes: { list: [{ url: 'http://btc.onion/bitcoind' }] }
  }
}

const references = { mainnet, testnet }

function withAdm(config: NetworkConfig, adm: NetworkConfig['adm']): NetworkConfig {
  return { ...config, adm: { ...config.adm, ...adm } }
}

function readCommittedConfig(variant: NetworkConfigVariant): NetworkConfig {
  return JSON.parse(readFileSync(path.resolve('src', 'config', `${variant}.json`), 'utf8'))
}

type TestPlugin = {
  configResolved: (config: { mode: string; root: string; command: string }) => void
  resolveId: (id: string) => string | null
  generateBundle: (options: unknown, bundle: unknown) => void
}

function createPlugin(target: NetworkBuildTarget, mode: string, root = process.cwd()) {
  const plugin = networkConfigPlugin(target) as unknown as TestPlugin
  plugin.configResolved({ mode, root, command: 'build' })

  return plugin
}

function generateBundle(plugin: TestPlugin, moduleIds: string[]) {
  const context = {
    error(message: string): never {
      throw new Error(message)
    }
  }

  plugin.generateBundle.call(context, {}, { 'assets/index.js': { type: 'chunk', moduleIds } })
}

describe('resolveNetworkConfigVariant', () => {
  it.each(
    Object.entries(SUPPORTED_NETWORK_MODES).flatMap(([target, modes]) =>
      Object.entries(modes).map(([mode, variant]) => [target, mode, variant])
    )
  )('maps the %s target in %s mode to the %s configuration', (target, mode, variant) => {
    expect(resolveNetworkConfigVariant(target as NetworkBuildTarget, mode)).toBe(variant)
  })

  it.each(Object.keys(SUPPORTED_NETWORK_MODES))(
    'rejects tor-testnet for the %s target',
    (target) => {
      expect(() =>
        resolveNetworkConfigVariant(target as NetworkBuildTarget, 'tor-testnet')
      ).toThrow('cannot be combined with testnet')
    }
  )

  it.each([
    ['electron', 'testnet'],
    ['electron', 'tor'],
    ['android', 'testnet'],
    ['android', 'tor']
  ])('rejects the %s target in %s mode', (target, mode) => {
    expect(() => resolveNetworkConfigVariant(target as NetworkBuildTarget, mode)).toThrow(
      'built only for the PWA target'
    )
  })

  it.each(['tor-dev', 'staging', 'test', '', 'constructor', '__proto__'])(
    'rejects the unknown PWA mode %j',
    (mode) => {
      expect(() => resolveNetworkConfigVariant('pwa', mode)).toThrow(
        'The mode has no generated network configuration.'
      )
    }
  )

  it.each(['pwa', 'electron', 'android'])(
    'bundles mainnet in development and production modes for the %s target',
    (target) => {
      expect(resolveNetworkConfigVariant(target as NetworkBuildTarget, 'development')).toBe(
        'mainnet'
      )
      expect(resolveNetworkConfigVariant(target as NetworkBuildTarget, 'production')).toBe(
        'mainnet'
      )
    }
  )
})

describe('findNetworkConfigViolations', () => {
  it('accepts isolated mainnet, testnet, and Tor configurations', () => {
    expect(findNetworkConfigViolations('mainnet', mainnet, references)).toEqual([])
    expect(findNetworkConfigViolations('testnet', testnet, references)).toEqual([])
    expect(findNetworkConfigViolations('tor', tor, references)).toEqual([])
  })

  it('rejects mainnet ADM nodes, IPFS nodes, and explorer links in testnet', () => {
    const config = withAdm(testnet, {
      explorerTx: 'https://explorer.mainnet.example/tx/${ID}',
      nodes: { list: [{ url: 'https://adm.testnet.example', alt_ip: 'http://192.0.2.1:36666' }] },
      services: {
        infoService: { list: [{ url: 'https://info.example' }] },
        ipfsNode: { list: [{ url: 'https://ipfs.mainnet.example/' }] }
      }
    })

    expect(findNetworkConfigViolations('testnet', config, references)).toEqual([
      'adm.nodes.list[0].alt_ip: testnet configuration uses the mainnet origin http://192.0.2.1:36666',
      'adm.services.ipfsNode.list[0].url: testnet configuration uses the mainnet origin https://ipfs.mainnet.example',
      'adm.explorerTx: testnet configuration uses the mainnet origin https://explorer.mainnet.example'
    ])
  })

  it('rejects testnet ADM endpoints in mainnet configurations', () => {
    const config = withAdm(mainnet, { nodes: { list: [{ url: 'https://adm.testnet.example' }] } })

    expect(findNetworkConfigViolations('mainnet', config, references)).toEqual([
      'adm.nodes.list[0].url: mainnet configuration uses the testnet origin https://adm.testnet.example'
    ])
  })

  it('rejects clearnet Tor node and service endpoints but allows clearnet explorer links', () => {
    const config = withAdm(tor, {
      explorer: 'https://explorer.mainnet.example',
      nodes: { list: [{ url: 'http://adm.onion', alt_ip: 'http://192.0.2.1:36666' }] },
      services: {
        infoService: { list: [{ url: 'https://info.example' }] },
        ipfsNode: { list: [{ url: 'http://ipfs.onion' }] }
      }
    })

    expect(findNetworkConfigViolations('tor', config, references)).toEqual([
      'adm.nodes.list[0].alt_ip: Tor endpoints must use onion hosts, found http://192.0.2.1:36666',
      'adm.services.infoService.list[0].url: Tor endpoints must use onion hosts, found https://info.example'
    ])
  })

  it('rejects onion endpoints outside Tor', () => {
    const config = withAdm(mainnet, { nodes: { list: [{ url: 'http://adm.onion' }] } })

    expect(findNetworkConfigViolations('mainnet', config, references)).toEqual([
      'adm.nodes.list[0].url: mainnet endpoints must not use onion hosts, found http://adm.onion'
    ])
  })

  it('rejects invalid endpoints and explorer links', () => {
    const config: NetworkConfig = {
      btc: {
        explorer: 'javascript:alert(1)',
        nodes: { list: [{ url: 'ftp://btc.example' }, {}] }
      }
    }

    expect(findNetworkConfigViolations('mainnet', config, references)).toEqual([
      'btc.explorer: invalid HTTP(S) URL "javascript:alert(1)"',
      'btc.nodes.list[0].url: invalid HTTP(S) endpoint "ftp://btc.example"',
      'btc.nodes.list[1].url: invalid HTTP(S) endpoint undefined'
    ])
  })
})

describe('findBundledNetworkConfigViolations', () => {
  const configsDir = path.resolve('/workspace', 'src', 'config')
  const moduleId = (name: string) => path.join(configsDir, `${name}.json`)

  it('accepts a bundle with only the expected configuration', () => {
    expect(
      findBundledNetworkConfigViolations(
        'testnet',
        [moduleId('testnet'), path.resolve('/workspace/src/lib/constants/cryptos/data.json')],
        configsDir
      )
    ).toEqual([])
  })

  it('rejects a bundle that includes another network configuration', () => {
    expect(
      findBundledNetworkConfigViolations(
        'tor',
        [moduleId('tor'), moduleId('mainnet'), moduleId('testnet')],
        configsDir
      )
    ).toEqual([
      'the bundle includes the mainnet network configuration',
      'the bundle includes the testnet network configuration'
    ])
  })

  it('rejects a bundle without the expected configuration', () => {
    expect(
      findBundledNetworkConfigViolations('testnet', [moduleId('mainnet')], configsDir)
    ).toEqual([
      'the bundle does not include the testnet network configuration',
      'the bundle includes the mainnet network configuration'
    ])
  })
})

describe('networkConfigPlugin', () => {
  it('resolves the virtual module to the configuration selected by the mode', () => {
    const plugin = createPlugin('pwa', 'testnet', '/workspace')

    expect(plugin.resolveId(NETWORK_CONFIG_MODULE_ID)).toBe(
      normalizePath(path.resolve('/workspace', 'src', 'config', 'testnet.json'))
    )
    expect(plugin.resolveId('@/config')).toBeNull()
  })

  it('fails while resolving the build configuration for unsupported modes', () => {
    expect(() => createPlugin('pwa', 'tor-testnet')).toThrow('Unsupported Vite mode "tor-testnet"')
  })

  it.each(Object.keys(SUPPORTED_NETWORK_MODES.pwa))(
    'accepts the committed configuration bundle in %s mode',
    (mode) => {
      const plugin = createPlugin('pwa', mode)
      const variant = resolveNetworkConfigVariant('pwa', mode)

      expect(() =>
        generateBundle(plugin, [path.resolve('src', 'config', `${variant}.json`)])
      ).not.toThrow()
    }
  )

  it('fails the build when another configuration is bundled', () => {
    const plugin = createPlugin('pwa', 'tor')

    expect(() =>
      generateBundle(plugin, [
        path.resolve('src', 'config', 'tor.json'),
        path.resolve('src', 'config', 'mainnet.json')
      ])
    ).toThrow('the bundle includes the mainnet network configuration')
  })
})

describe('committed network configurations', () => {
  const committedReferences = {
    mainnet: readCommittedConfig('mainnet'),
    testnet: readCommittedConfig('testnet')
  }

  it.each(NETWORK_CONFIG_VARIANTS)('satisfy the runtime network contract for %s', (variant) => {
    expect(
      findNetworkConfigViolations(variant, readCommittedConfig(variant), committedReferences)
    ).toEqual([])
  })
})
