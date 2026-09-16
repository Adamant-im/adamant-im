// @vitest-environment node

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  NETWORK_CONFIG_MODULE_ID,
  NETWORK_CONFIG_VARIANTS,
  SUPPORTED_NETWORK_MODES,
  findBundledNetworkConfigViolations,
  findEmittedNetworkConfigViolations,
  findNetworkConfigViolations,
  findUnexpectedNetworkConfigFiles,
  networkConfigPlugin,
  resolveNetworkConfigVariant,
  type NetworkBuildTarget,
  type NetworkConfig,
  type NetworkConfigVariant
} from './networkConfigPlugin'

const nodeHealthCheck = {
  normalUpdateInterval: 300000,
  crucialUpdateInterval: 30000,
  onScreenUpdateInterval: 10000,
  threshold: 10
}

const serviceHealthCheck = {
  normalUpdateInterval: 300000,
  crucialUpdateInterval: 30000,
  onScreenUpdateInterval: 10000,
  threshold: 10
}

const mainnet: NetworkConfig = {
  adm: {
    explorer: 'https://explorer.mainnet.example',
    explorerTx: 'https://explorer.mainnet.example/tx/${ID}',
    explorerAddress: 'https://explorer.mainnet.example/address/${ID}',
    nodes: {
      list: [{ url: 'https://adm.mainnet.example', alt_ip: 'http://192.0.2.1:36666' }],
      healthCheck: nodeHealthCheck
    },
    services: {
      infoService: { list: [{ url: 'https://info.example' }], healthCheck: serviceHealthCheck },
      ipfsNode: {
        list: [{ url: 'https://ipfs.mainnet.example' }],
        healthCheck: serviceHealthCheck
      }
    }
  },
  btc: {
    explorer: 'https://btc-explorer.example',
    explorerTx: 'https://btc-explorer.example/tx/${ID}',
    explorerAddress: 'https://btc-explorer.example/address/${ID}',
    nodes: { list: [{ url: 'https://btc.example/bitcoind' }], healthCheck: nodeHealthCheck },
    services: {
      btcIndexer: {
        list: [{ url: 'https://btc-indexer.example' }],
        healthCheck: serviceHealthCheck
      }
    }
  },
  dash: {
    explorer: 'https://dash-explorer.example',
    explorerTx: 'https://dash-explorer.example/tx/${ID}',
    explorerAddress: 'https://dash-explorer.example/address/${ID}',
    nodes: { list: [{ url: 'https://dash.example' }], healthCheck: nodeHealthCheck }
  },
  doge: {
    explorer: 'https://doge-explorer.example',
    explorerTx: 'https://doge-explorer.example/tx/${ID}',
    explorerAddress: 'https://doge-explorer.example/address/${ID}',
    nodes: { list: [{ url: 'https://doge.example' }], healthCheck: nodeHealthCheck },
    services: {
      dogeIndexer: {
        list: [{ url: 'https://doge-indexer.example' }],
        healthCheck: serviceHealthCheck
      }
    }
  },
  eth: {
    explorer: 'https://eth-explorer.example',
    explorerTx: 'https://eth-explorer.example/tx/${ID}',
    explorerAddress: 'https://eth-explorer.example/address/${ID}',
    nodes: { list: [{ url: 'https://eth.example' }], healthCheck: nodeHealthCheck },
    services: {
      ethIndexer: {
        list: [{ url: 'https://eth-indexer.example' }],
        healthCheck: serviceHealthCheck
      }
    }
  }
}

const testnet: NetworkConfig = {
  adm: {
    explorer: 'https://explorer.testnet.example',
    explorerTx: 'https://explorer.testnet.example/tx/${ID}',
    explorerAddress: 'https://explorer.testnet.example/address/${ID}',
    nodes: {
      list: [{ url: 'https://adm.testnet.example' }],
      healthCheck: nodeHealthCheck
    },
    services: {
      infoService: { list: [{ url: 'https://info.example' }], healthCheck: serviceHealthCheck },
      ipfsNode: {
        list: [{ url: 'https://ipfs.testnet.example' }],
        healthCheck: serviceHealthCheck
      }
    }
  },
  btc: mainnet.btc,
  dash: mainnet.dash,
  doge: mainnet.doge,
  eth: mainnet.eth
}

const tor: NetworkConfig = {
  adm: {
    explorer: 'http://explorer.onion',
    explorerTx: 'http://explorer.onion/tx/${ID}',
    explorerAddress: 'http://explorer.onion/address/${ID}',
    nodes: { list: [{ url: 'http://adm.onion' }], healthCheck: nodeHealthCheck },
    services: {
      infoService: { list: [{ url: 'http://info.onion' }], healthCheck: serviceHealthCheck },
      ipfsNode: { list: [{ url: 'http://ipfs.onion' }], healthCheck: serviceHealthCheck }
    }
  },
  btc: {
    explorer: 'https://btc-explorer.example',
    explorerTx: 'https://btc-explorer.example/tx/${ID}',
    explorerAddress: 'https://btc-explorer.example/address/${ID}',
    nodes: { list: [{ url: 'http://btc.onion/bitcoind' }], healthCheck: nodeHealthCheck },
    services: {
      btcIndexer: { list: [{ url: 'http://btc-indexer.onion' }], healthCheck: serviceHealthCheck }
    }
  },
  dash: {
    explorer: 'https://dash-explorer.example',
    explorerTx: 'https://dash-explorer.example/tx/${ID}',
    explorerAddress: 'https://dash-explorer.example/address/${ID}',
    nodes: { list: [{ url: 'http://dash.onion' }], healthCheck: nodeHealthCheck }
  },
  doge: {
    explorer: 'https://doge-explorer.example',
    explorerTx: 'https://doge-explorer.example/tx/${ID}',
    explorerAddress: 'https://doge-explorer.example/address/${ID}',
    nodes: { list: [{ url: 'http://doge.onion' }], healthCheck: nodeHealthCheck },
    services: {
      dogeIndexer: {
        list: [{ url: 'http://doge-indexer.onion' }],
        healthCheck: serviceHealthCheck
      }
    }
  },
  eth: {
    explorer: 'https://eth-explorer.example',
    explorerTx: 'https://eth-explorer.example/tx/${ID}',
    explorerAddress: 'https://eth-explorer.example/address/${ID}',
    nodes: { list: [{ url: 'http://eth.onion' }], healthCheck: nodeHealthCheck },
    services: {
      ethIndexer: { list: [{ url: 'http://eth-indexer.onion' }], healthCheck: serviceHealthCheck }
    }
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
  load: (id: string) => string | null
  generateBundle: (options: unknown, bundle: unknown) => void
}

function createPlugin(target: NetworkBuildTarget, mode: string, root = process.cwd()) {
  const plugin = networkConfigPlugin(target) as unknown as TestPlugin
  plugin.configResolved({ mode, root, command: 'build' })

  return plugin
}

function generateBundle(plugin: TestPlugin, chunks: Array<{ moduleIds: string[]; code: string }>) {
  const context = {
    error(message: string): never {
      throw new Error(message)
    }
  }

  plugin.generateBundle.call(
    context,
    {},
    Object.fromEntries(
      chunks.map(({ moduleIds, code }, index) => [
        `assets/chunk-${index}.js`,
        { type: 'chunk', moduleIds, code, modules: {} }
      ])
    )
  )
}

function emittedChunk(plugin: TestPlugin) {
  const configPath = plugin.resolveId(NETWORK_CONFIG_MODULE_ID)

  if (!configPath) {
    throw new Error('The plugin did not resolve the virtual network config module')
  }

  const code = plugin.load(configPath)

  if (typeof code !== 'string') {
    throw new Error('The plugin did not load the selected network config module')
  }

  return { moduleIds: [configPath], code }
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

  it('rejects a configuration without the coins of the mainnet configuration', () => {
    expect(findNetworkConfigViolations('tor', {}, references)).toEqual([
      'the network configuration has no coins',
      'adm: missing coin configuration',
      'btc: missing coin configuration',
      'dash: missing coin configuration',
      'doge: missing coin configuration',
      'eth: missing coin configuration'
    ])
  })

  it('rejects missing, empty, and malformed endpoint lists', () => {
    const config = withAdm(mainnet, {
      nodes: { list: [], healthCheck: nodeHealthCheck },
      services: {
        infoService: { list: [{ url: 42 }], healthCheck: serviceHealthCheck }
      }
    })

    expect(findNetworkConfigViolations('mainnet', config, references)).toEqual([
      'adm.nodes.list: expected a non-empty array of endpoints',
      'adm.services.infoService.list[0].url: expected a string',
      'adm.services.ipfsNode: missing endpoint list'
    ])
  })

  it('rejects endpoint sections that are not objects', () => {
    const config = {
      ...mainnet,
      btc: { ...mainnet.btc, nodes: 'https://btc.example' }
    } as unknown as NetworkConfig

    expect(findNetworkConfigViolations('mainnet', config, references)).toEqual([
      'btc.nodes: expected an object'
    ])
  })

  it('rejects required runtime fields independently of the generated references', () => {
    const config = withAdm(tor, {
      explorer: undefined,
      nodes: { list: [{ url: 'http://adm.onion' }] }
    })
    const reducedReferences = {
      mainnet: { adm: mainnet.adm } as NetworkConfig,
      testnet: { adm: testnet.adm } as NetworkConfig
    }

    expect(findNetworkConfigViolations('tor', config, reducedReferences)).toEqual([
      'adm.explorer: expected a string',
      'adm.nodes.healthCheck: expected an object'
    ])
  })

  it('rejects mainnet ADM nodes, IPFS nodes, and explorer links in testnet', () => {
    const config = withAdm(testnet, {
      explorerTx: 'https://explorer.mainnet.example/tx/${ID}',
      nodes: {
        ...testnet.adm?.nodes,
        list: [{ url: 'https://adm.testnet.example', alt_ip: 'http://192.0.2.1:36666' }]
      },
      services: {
        infoService: {
          ...testnet.adm?.services?.infoService,
          list: [{ url: 'https://info.example' }]
        },
        ipfsNode: {
          ...testnet.adm?.services?.ipfsNode,
          list: [{ url: 'https://ipfs.mainnet.example/' }]
        }
      }
    })

    expect(findNetworkConfigViolations('testnet', config, references)).toEqual([
      'adm.nodes.list[0].alt_ip: testnet configuration uses the mainnet origin http://192.0.2.1:36666',
      'adm.services.ipfsNode.list[0].url: testnet configuration uses the mainnet origin https://ipfs.mainnet.example',
      'adm.explorerTx: testnet configuration uses the mainnet origin https://explorer.mainnet.example'
    ])
  })

  it('rejects testnet ADM endpoints in mainnet configurations', () => {
    const config = withAdm(mainnet, {
      nodes: { ...mainnet.adm?.nodes, list: [{ url: 'https://adm.testnet.example' }] }
    })

    expect(findNetworkConfigViolations('mainnet', config, references)).toEqual([
      'adm.nodes.list[0].url: mainnet configuration uses the testnet origin https://adm.testnet.example'
    ])
  })

  it('rejects clearnet Tor node and service endpoints', () => {
    const config = withAdm(tor, {
      nodes: {
        ...tor.adm?.nodes,
        list: [{ url: 'http://adm.onion', alt_ip: 'http://192.0.2.1:36666' }]
      },
      services: {
        infoService: { ...tor.adm?.services?.infoService, list: [{ url: 'https://info.example' }] },
        ipfsNode: { ...tor.adm?.services?.ipfsNode, list: [{ url: 'http://ipfs.onion' }] }
      }
    })

    expect(findNetworkConfigViolations('tor', config, references)).toEqual([
      'adm.nodes.list[0].alt_ip: Tor endpoints must use onion hosts, found http://192.0.2.1:36666',
      'adm.services.infoService.list[0].url: Tor endpoints must use onion hosts, found https://info.example'
    ])
  })

  it('rejects clearnet ADM explorer links in Tor while allowing third-party explorer links', () => {
    const config = withAdm(tor, {
      explorer: 'https://explorer.mainnet.example',
      explorerAddress: 'https://explorer.mainnet.example/address/${ID}'
    })

    expect(findNetworkConfigViolations('tor', config, references)).toEqual([
      'adm.explorer: Tor ADM explorer links must use onion hosts, found https://explorer.mainnet.example',
      'adm.explorerAddress: Tor ADM explorer links must use onion hosts, found https://explorer.mainnet.example/address/${ID}'
    ])
  })

  it('rejects onion endpoints outside Tor', () => {
    const config = withAdm(mainnet, {
      nodes: { ...mainnet.adm?.nodes, list: [{ url: 'http://adm.onion' }] }
    })

    expect(findNetworkConfigViolations('mainnet', config, references)).toEqual([
      'adm.nodes.list[0].url: mainnet endpoints must not use onion hosts, found http://adm.onion'
    ])
  })

  it('rejects invalid endpoints and explorer links', () => {
    const config = {
      ...mainnet,
      btc: {
        ...mainnet.btc,
        explorer: 'javascript:alert(1)',
        nodes: { ...mainnet.btc?.nodes, list: [{ url: 'ftp://btc.example' }] }
      }
    }

    expect(findNetworkConfigViolations('mainnet', config, references)).toEqual([
      'btc.explorer: invalid HTTP(S) URL "javascript:alert(1)"',
      'btc.nodes.list[0].url: invalid HTTP(S) endpoint "ftp://btc.example"'
    ])
  })
})

describe('findEmittedNetworkConfigViolations', () => {
  const emittedConfig: NetworkConfig = {
    adm: {
      explorer: 'http://explorer.onion',
      nodes: { list: [{ url: 'http://adm.onion' }] }
    },
    btc: {
      explorer: 'https://btc-explorer.example'
    }
  }

  const emit = (entries: Array<[string, string]>) =>
    entries
      .map(
        ([fieldPath, url]) =>
          `(globalThis.__ADAMANT_NETWORK_CONFIG_URLS__ ??= {}, globalThis.__ADAMANT_NETWORK_CONFIG_URLS__["__ADAMANT_NETWORK_CONFIG_URL__:${fieldPath}"] = ${JSON.stringify(url)})`
      )
      .join('\n')

  it('accepts emitted code with exactly the generated endpoints', () => {
    expect(
      findEmittedNetworkConfigViolations(
        'tor',
        emittedConfig,
        emit([
          ['adm.explorer', 'http://explorer.onion'],
          ['adm.nodes.list[0].url', 'http://adm.onion'],
          ['btc.explorer', 'https://btc-explorer.example']
        ])
      )
    ).toEqual([])
  })

  it('rejects a path that ships a different URL than the generated file', () => {
    expect(
      findEmittedNetworkConfigViolations(
        'tor',
        emittedConfig,
        emit([
          ['adm.explorer', 'http://explorer.onion'],
          ['adm.nodes.list[0].url', 'https://adm.mainnet.example'],
          ['btc.explorer', 'https://btc-explorer.example']
        ])
      )
    ).toEqual([
      'the emitted tor configuration sets adm.nodes.list[0].url to https://adm.mainnet.example, expected http://adm.onion'
    ])
  })

  it('rejects swapped URLs that keep the same set of strings', () => {
    expect(
      findEmittedNetworkConfigViolations(
        'tor',
        emittedConfig,
        emit([
          ['adm.explorer', 'http://explorer.onion'],
          ['adm.nodes.list[0].url', 'https://btc-explorer.example'],
          ['btc.explorer', 'http://adm.onion']
        ])
      )
    ).toEqual([
      'the emitted tor configuration sets adm.nodes.list[0].url to https://btc-explorer.example, expected http://adm.onion',
      'the emitted tor configuration sets btc.explorer to http://adm.onion, expected https://btc-explorer.example'
    ])
  })

  it('rejects emitted code that drops the marked config paths', () => {
    expect(
      findEmittedNetworkConfigViolations('mainnet', emittedConfig, 'const config = {}')
    ).toEqual(['the final emitted chunk did not expose the marked mainnet network configuration'])
  })

  it('rejects emitted code that the bundler does not expose', () => {
    expect(findEmittedNetworkConfigViolations('tor', emittedConfig, null)).toEqual([
      'the final emitted chunk did not expose the marked tor network configuration'
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

    expect(plugin.resolveId(NETWORK_CONFIG_MODULE_ID)).toBe('\0adamant-network-config:testnet')
    expect(plugin.resolveId('@/config')).toBeNull()
  })

  it('fails while resolving the build configuration for unsupported modes', () => {
    expect(() => createPlugin('pwa', 'tor-testnet')).toThrow('Unsupported Vite mode "tor-testnet"')
  })

  it('lists JSON files that the generator does not create', () => {
    expect(
      findUnexpectedNetworkConfigFiles([
        'index.js',
        'utils',
        'production.json',
        'mainnet.json',
        'testnet.json',
        'tor.json',
        'development.json'
      ])
    ).toEqual(['development.json', 'production.json'])
  })

  it('fails while resolving the build configuration when src/config has an unexpected JSON file', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'adamant-network-config-'))

    try {
      const configsDir = path.join(root, 'src', 'config')
      mkdirSync(configsDir, { recursive: true })

      for (const fileName of ['index.js', 'mainnet.json', 'testnet.json', 'tor.json']) {
        writeFileSync(path.join(configsDir, fileName), '{}')
      }

      expect(() => createPlugin('pwa', 'tor', root)).not.toThrow()

      // A legacy deployment script copies the Tor configuration over the removed production file
      writeFileSync(path.join(configsDir, 'production.json'), '{}')

      expect(() => createPlugin('pwa', 'tor', root)).toThrow(
        'Unexpected network configuration files in src/config: production.json'
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it.each(Object.keys(SUPPORTED_NETWORK_MODES.pwa))(
    'accepts the committed configuration bundle in %s mode',
    (mode) => {
      const plugin = createPlugin('pwa', mode)
      const chunk = emittedChunk(plugin)

      expect(() => generateBundle(plugin, [chunk])).not.toThrow()
    }
  )

  it('fails the build when another configuration is bundled', () => {
    const plugin = createPlugin('pwa', 'tor')
    const chunk = emittedChunk(plugin)

    expect(() =>
      generateBundle(plugin, [
        chunk,
        { moduleIds: [path.resolve('src', 'config', 'mainnet.json')], code: 'const other = {}' }
      ])
    ).toThrow('the bundle includes the mainnet network configuration')
  })

  it('fails the build when the final emitted chunk ships a different endpoint', () => {
    const plugin = createPlugin('pwa', 'tor')
    const chunk = emittedChunk(plugin)
    const tamperedChunk = {
      ...chunk,
      code: chunk.code.replace(
        'http://37g5to2z6bdoeegun4hms2hvkfbdxh4rcon4e3p267wtfkh4ji2ns6id.onion',
        'https://clown.adamant.im'
      )
    }

    expect(() => generateBundle(plugin, [tamperedChunk])).toThrow(
      'the emitted tor configuration sets adm.nodes.list[0].url to https://clown.adamant.im'
    )
  })

  it('fails the build when the final emitted chunk does not expose the marked config', () => {
    const plugin = createPlugin('pwa', 'production')
    const chunk = emittedChunk(plugin)

    expect(() => generateBundle(plugin, [{ ...chunk, code: 'const config = {}' }])).toThrow(
      'the final emitted chunk did not expose the marked mainnet network configuration'
    )
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
