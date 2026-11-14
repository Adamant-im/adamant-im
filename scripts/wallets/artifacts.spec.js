// @vitest-environment node

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  buildWalletArtifacts,
  findWalletArtifactDrift,
  getWalletArtifactPaths,
  writeWalletArtifacts
} from './artifacts.mjs'

const healthCheck = {
  normalUpdateInterval: 300000,
  crucialUpdateInterval: 30000,
  onScreenUpdateInterval: 10000,
  threshold: 10
}

let rootDir
let paths

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(value, null, 2))
}

async function writeGeneralCoin(dirName, info) {
  const coinDir = join(paths.assetsDir, 'general', dirName)

  await writeJson(join(coinDir, 'info.json'), info)
  await mkdir(join(coinDir, 'images'), { recursive: true })
  await writeFile(
    join(coinDir, 'images', 'icon.vue'),
    `<template><svg id="${dirName}" /></template>\n`
  )
}

async function createMetadataFixture() {
  await writeGeneralCoin('adamant', {
    symbol: 'ADM',
    status: 'active',
    createCoin: true,
    explorer: 'https://explorer.mainnet.example',
    nodes: { displayName: 'adm-node', list: [{ url: 'https://adm.mainnet.example' }], healthCheck },
    services: {
      ipfsNode: {
        displayName: 'ipfs-node',
        list: [{ url: 'https://ipfs.mainnet.example' }],
        healthCheck
      }
    },
    testnet: {
      explorer: 'https://explorer.testnet.example',
      nodes: { list: [{ url: 'https://adm.testnet.example' }] },
      services: { ipfsNode: { list: [{ url: 'https://ipfs.testnet.example' }] } }
    },
    tor: {
      explorer: 'http://explorer.onion',
      nodes: { list: [{ url: 'http://adm.onion' }] },
      services: { ipfsNode: { list: [{ url: 'http://ipfs.onion' }] } }
    }
  })
  await writeGeneralCoin('ethereum', {
    symbol: 'ETH',
    status: 'active',
    createCoin: true,
    explorer: 'https://eth-explorer.example',
    nodes: { displayName: 'eth-node', list: [{ url: 'https://eth.example' }], healthCheck },
    tor: { nodes: { displayName: 'eth-node', list: [{ url: 'http://eth.onion' }], healthCheck } }
  })
  await writeGeneralCoin('usdt', { symbol: 'USDT', status: 'active', createCoin: false })
  await writeGeneralCoin('retired', { symbol: 'OLD', status: 'disabled', createCoin: true })
  await writeJson(join(paths.assetsDir, 'blockchains', 'ethereum', 'info.json'), {
    mainCoin: 'ethereum',
    type: 'ERC20',
    defaultGasLimit: 58000
  })
  await writeJson(join(paths.assetsDir, 'blockchains', 'ethereum', 'usdt', 'info.json'), {
    symbol: 'USDT',
    decimals: 6
  })
}

beforeEach(async () => {
  rootDir = await mkdtemp(join(tmpdir(), 'adamant-wallet-artifacts-'))
  paths = getWalletArtifactPaths(rootDir)

  await mkdir(dirname(paths.cryptosDataFile), { recursive: true })
  await mkdir(paths.configsDir, { recursive: true })
  await createMetadataFixture()
})

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true })
})

describe('buildWalletArtifacts', () => {
  it('builds deterministic data, icons, and every network configuration variant', async () => {
    const artifacts = await buildWalletArtifacts(paths)

    expect(await buildWalletArtifacts(paths)).toEqual(artifacts)
    expect(artifacts.configFiles.map((file) => file.path)).toEqual(
      ['mainnet', 'testnet', 'tor'].map((name) => join(paths.configsDir, `${name}.json`))
    )
    expect(artifacts.iconFiles.map((file) => file.path)).toEqual(
      ['AdmIcon.vue', 'EthIcon.vue', 'UsdtIcon.vue'].map((name) => join(paths.cryptoIconsDir, name))
    )

    const data = JSON.parse(artifacts.dataFile.contents)
    expect(Object.keys(data)).toEqual(['ADM', 'ETH', 'USDT'])
    expect(data.USDT).toMatchObject({ mainCoin: 'ETH', type: 'ERC20', decimals: 6 })

    const [mainnet, testnet, tor] = artifacts.configFiles.map((file) => JSON.parse(file.contents))
    expect(Object.keys(mainnet)).toEqual(['adm', 'eth'])
    expect(testnet.adm).toMatchObject({
      explorer: 'https://explorer.testnet.example',
      nodes: { list: [{ url: 'https://adm.testnet.example' }] },
      services: { ipfsNode: { list: [{ url: 'https://ipfs.testnet.example' }] } }
    })
    expect(testnet.eth).toEqual(mainnet.eth)
    expect(tor.adm.nodes.list).toEqual([{ url: 'http://adm.onion' }])
    expect(tor.eth.explorer).toBe('https://eth-explorer.example')
  })

  it('rejects coin symbols that could escape generated directories', async () => {
    await writeGeneralCoin('evil', { symbol: '../Evil', status: 'active', createCoin: false })

    await expect(buildWalletArtifacts(paths)).rejects.toThrow('Unsupported coin symbol')
  })
})

describe('findWalletArtifactDrift', () => {
  it('reports no drift for freshly written artifacts', async () => {
    const artifacts = await buildWalletArtifacts(paths)
    await writeWalletArtifacts(artifacts, paths)

    expect(await findWalletArtifactDrift(artifacts, paths)).toEqual([])
  })

  it('detects changed, missing, and unexpected files without writing anything', async () => {
    const artifacts = await buildWalletArtifacts(paths)
    await writeWalletArtifacts(artifacts, paths)

    const testnetPath = join(paths.configsDir, 'testnet.json')
    const staleTestnet = (await readFile(testnetPath, 'utf8')).replace(
      'https://ipfs.testnet.example',
      'https://ipfs.mainnet.example'
    )
    await writeFile(testnetPath, staleTestnet)
    await rm(join(paths.configsDir, 'tor.json'))
    await writeFile(join(paths.cryptoIconsDir, 'OldIcon.vue'), '<template />\n')

    const drift = await findWalletArtifactDrift(artifacts, paths)

    expect(drift).toEqual(
      expect.arrayContaining([
        { path: testnetPath, reason: 'changed' },
        { path: join(paths.configsDir, 'tor.json'), reason: 'missing' },
        { path: join(paths.cryptoIconsDir, 'OldIcon.vue'), reason: 'unexpected' }
      ])
    )
    expect(drift).toHaveLength(3)
    expect(await readFile(testnetPath, 'utf8')).toBe(staleTestnet)
    await expect(readFile(join(paths.configsDir, 'tor.json'), 'utf8')).rejects.toThrow('ENOENT')
  })

  it('ignores CRLF line endings from Windows checkouts', async () => {
    const artifacts = await buildWalletArtifacts(paths)
    await writeWalletArtifacts(artifacts, paths)
    await writeFile(paths.cryptosDataFile, artifacts.dataFile.contents.replace(/\n/g, '\r\n'))

    expect(await findWalletArtifactDrift(artifacts, paths)).toEqual([])
  })

  it('reports and removes network configurations that are no longer generated', async () => {
    const artifacts = await buildWalletArtifacts(paths)
    await writeWalletArtifacts(artifacts, paths)

    const retiredConfigPath = join(paths.configsDir, 'production.json')
    const runtimeModulePath = join(paths.configsDir, 'index.js')
    await writeFile(retiredConfigPath, '{}')
    await writeFile(runtimeModulePath, 'export {}\n')

    expect(await findWalletArtifactDrift(artifacts, paths)).toEqual([
      { path: retiredConfigPath, reason: 'unexpected' }
    ])

    await writeWalletArtifacts(artifacts, paths)

    await expect(readFile(retiredConfigPath, 'utf8')).rejects.toThrow('ENOENT')
    expect(await readFile(runtimeModulePath, 'utf8')).toBe('export {}\n')
    expect(await findWalletArtifactDrift(artifacts, paths)).toEqual([])
  })
})
