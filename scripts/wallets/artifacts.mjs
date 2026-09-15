import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises'
import { isAbsolute, join, relative, resolve, sep } from 'path'
import capitalize from 'lodash-es/capitalize.js'
import omit from 'lodash-es/omit.js'

import {
  NETWORK_CONFIG_VARIANTS,
  compareCodeUnits,
  resolveNetworkConfig
} from './networkConfig.mjs'

// Coin symbols become generated file names, so they must not contain path separators or dots.
const COIN_SYMBOL_PATTERN = /^[A-Za-z0-9]+$/

/**
 * @typedef {object} WalletArtifactPaths
 * @property {string} assetsDir Metadata source: `adamant-wallets/assets`
 * @property {string} cryptosDataFile Generated coin metadata snapshot
 * @property {string} cryptoIconsDir Generated coin icon components
 * @property {string} configsDir Generated runtime network configuration variants
 */

/**
 * @typedef {object} GeneratedFile
 * @property {string} path Absolute destination path
 * @property {string} contents Expected file contents
 */

/**
 * @typedef {object} WalletArtifacts
 * @property {GeneratedFile} dataFile
 * @property {GeneratedFile[]} iconFiles
 * @property {GeneratedFile[]} configFiles
 */

/**
 * @typedef {object} WalletArtifactDrift
 * @property {string} path Absolute path of the drifted file
 * @property {'missing' | 'changed' | 'unexpected'} reason
 */

/**
 * @param {string} [rootDir] Repository root
 * @returns {WalletArtifactPaths}
 */
export function getWalletArtifactPaths(rootDir = process.cwd()) {
  return {
    assetsDir: resolve(rootDir, 'adamant-wallets', 'assets'),
    cryptosDataFile: resolve(rootDir, 'src', 'lib', 'constants', 'cryptos', 'data.json'),
    cryptoIconsDir: resolve(rootDir, 'src', 'components', 'icons', 'cryptos'),
    configsDir: resolve(rootDir, 'src', 'config')
  }
}

/**
 * Builds every file generated from `adamant-wallets` metadata in memory. Nothing is written.
 *
 * @param {WalletArtifactPaths} paths
 * @returns {Promise<WalletArtifacts>}
 */
export async function buildWalletArtifacts(paths) {
  const generalAssetsDir = join(paths.assetsDir, 'general')
  const { coins, networkCoins, coinDirNames, coinSymbols } =
    await readGeneralCoins(generalAssetsDir)

  await applyBlockchains({ assetsDir: paths.assetsDir, generalAssetsDir, coins, coinSymbols })

  const sortedCoins = sortByKey(coins)

  const iconFiles = await Promise.all(
    Object.values(sortedCoins).map(async ({ symbol }) => {
      if (!coinDirNames[symbol]) {
        throw new Error(`Missing general asset directory for ${symbol}`)
      }

      return {
        path: resolveInside(paths.cryptoIconsDir, `${capitalize(symbol)}Icon.vue`),
        contents: await readTextFile(
          resolveInside(generalAssetsDir, coinDirNames[symbol], 'images', 'icon.vue')
        )
      }
    })
  )

  const configFiles = Object.keys(NETWORK_CONFIG_VARIANTS).map((variant) => ({
    path: resolveInside(paths.configsDir, `${variant}.json`),
    contents: JSON.stringify(resolveNetworkConfig(networkCoins, variant), null, 2)
  }))

  return {
    dataFile: { path: paths.cryptosDataFile, contents: JSON.stringify(sortedCoins, null, 2) },
    iconFiles,
    configFiles
  }
}

/**
 * Replaces generated files in the working tree.
 *
 * @param {WalletArtifacts} artifacts
 * @param {WalletArtifactPaths} paths
 * @returns {Promise<void>}
 */
export async function writeWalletArtifacts(artifacts, paths) {
  // Icons are removed first so that icons of retired coins do not survive regeneration
  await rm(paths.cryptoIconsDir, { recursive: true, force: true })
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed generated icons directory
  await mkdir(paths.cryptoIconsDir, { recursive: true })

  for (const file of [...artifacts.iconFiles, artifacts.dataFile, ...artifacts.configFiles]) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- generated destinations are fixed repository paths
    await writeFile(file.path, file.contents)
  }
}

/**
 * Compares generated artifacts with the working tree without writing anything. Line endings are
 * normalized because Windows checkouts may convert LF to CRLF.
 *
 * @param {WalletArtifacts} artifacts
 * @param {WalletArtifactPaths} paths
 * @returns {Promise<WalletArtifactDrift[]>}
 */
export async function findWalletArtifactDrift(artifacts, paths) {
  const drift = []

  for (const file of [artifacts.dataFile, ...artifacts.configFiles, ...artifacts.iconFiles]) {
    const actualContents = await readOptionalTextFile(file.path)

    if (actualContents === undefined) {
      drift.push({ path: file.path, reason: 'missing' })
    } else if (normalizeLineEndings(actualContents) !== normalizeLineEndings(file.contents)) {
      drift.push({ path: file.path, reason: 'changed' })
    }
  }

  const expectedIconPaths = new Set(artifacts.iconFiles.map((file) => file.path))

  for (const name of await readOptionalDirectory(paths.cryptoIconsDir)) {
    const path = join(paths.cryptoIconsDir, name)

    if (!expectedIconPaths.has(path)) {
      drift.push({ path, reason: 'unexpected' })
    }
  }

  return drift
}

async function readGeneralCoins(generalAssetsDir) {
  const coins = {}
  const networkCoins = {}
  const coinDirNames = {}
  const coinSymbols = {}

  await forEachDir(generalAssetsDir, async ({ name }) => {
    const path = join(generalAssetsDir, name, 'info.json')
    const coin = await parseJsonFile(path)

    if (coin.status !== 'active') {
      return
    }

    assertCoinSymbol(coin.symbol, path)

    coinDirNames[coin.symbol] = name
    coinSymbols[name] = coin.symbol
    coins[coin.symbol] = coin

    if (coin.createCoin) {
      networkCoins[coin.symbol.toLowerCase()] = coin
    }
  })

  return { coins, networkCoins, coinDirNames, coinSymbols }
}

async function applyBlockchains({ assetsDir, generalAssetsDir, coins, coinSymbols }) {
  const blockchainsPath = join(assetsDir, 'blockchains')

  await forEachDir(blockchainsPath, async ({ name: blockchainName }) => {
    const blockchainPath = join(blockchainsPath, blockchainName)
    const info = await parseJsonFile(join(blockchainPath, 'info.json'))
    const mainCoinInfo = coinSymbols[info.mainCoin] ? coins[coinSymbols[info.mainCoin]] : {}

    await forEachDir(blockchainPath, async ({ name: coinName }) => {
      const coinPath = join(blockchainPath, coinName, 'info.json')
      const coin = await parseJsonFile(coinPath)
      assertCoinSymbol(coin.symbol, coinPath)

      let tokenData = coins[coin.symbol] || {}

      if (!coins[coin.symbol]) {
        const generalTokenInfo = await parseJsonFile(join(generalAssetsDir, coinName, 'info.json'))

        if (generalTokenInfo.status === 'active') {
          tokenData = generalTokenInfo
        }
      }

      coins[coin.symbol] = {
        ...mainCoinInfo,
        ...tokenData,
        ...omit(info, ['mainCoin']),
        ...coin,
        mainCoin: coinSymbols[info.mainCoin],
        type: info.type,
        defaultGasLimit: info.defaultGasLimit,
        fees: info.fees
      }
    })
  })
}

function sortByKey(object) {
  return Object.fromEntries(
    Object.entries(object).sort(([first], [second]) => compareCodeUnits(first, second))
  )
}

function normalizeLineEndings(contents) {
  return contents.replace(/\r\n/g, '\n')
}

async function forEachDir(path, callback) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- lists only adamant-wallets asset directories
  const dirents = await readdir(path, { withFileTypes: true })

  await Promise.all(dirents.filter((dirent) => dirent.isDirectory()).map(callback))
}

async function parseJsonFile(path) {
  return JSON.parse(await readTextFile(path))
}

async function readTextFile(path) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- reads only repository-local files
  return readFile(path, 'utf-8')
}

async function readOptionalTextFile(path) {
  try {
    return await readTextFile(path)
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined

    throw error
  }
}

async function readOptionalDirectory(path) {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- lists only the generated icons directory
    return await readdir(path)
  } catch (error) {
    if (error?.code === 'ENOENT') return []

    throw error
  }
}

/**
 * Resolves a path and rejects the result when it escapes `baseDir`.
 *
 * @param {string} baseDir Trusted base directory
 * @param {...string} segments Path segments that may come from wallet metadata
 * @returns {string}
 */
function resolveInside(baseDir, ...segments) {
  const target = resolve(baseDir, ...segments)
  const relativePath = relative(baseDir, target)

  if (
    !relativePath ||
    relativePath === '..' ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new Error(`Refusing to access a path outside ${baseDir}: ${target}`)
  }

  return target
}

/**
 * @param {unknown} symbol Coin symbol declared in `info.json`
 * @param {string} sourcePath File that declares the symbol
 */
function assertCoinSymbol(symbol, sourcePath) {
  if (typeof symbol !== 'string' || !COIN_SYMBOL_PATTERN.test(symbol)) {
    throw new Error(`Unsupported coin symbol ${JSON.stringify(symbol)} in ${sourcePath}`)
  }
}
