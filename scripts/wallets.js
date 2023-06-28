import { $ } from 'execa'

import { copyFile, readdir, readFile, writeFile, mkdir, rm } from 'fs/promises'
import { resolve, join } from 'path'

import { strictCapitalize } from '../src/lib/textHelpers.js'

const CRYPTOS_DATA_FILE_PATH = resolve('src/lib/constants/cryptos/data.json')
const CRYPTOS_ICONS_DIR_PATH = resolve('src/components/icons/cryptos')
const GENERAL_ASSETS_PATH = resolve('adamant-wallets/assets/general')

run()

async function run() {
  // update adamant-wallets repo
  await $`git submodule update --recursive`

  const [coins, coinDirNames] = await initCoins()
  await applyBlockchains(coins)

  await copyIcons(coins, coinDirNames)

  await writeFile(CRYPTOS_DATA_FILE_PATH, JSON.stringify(coins, null, 2))
}

async function initCoins() {
  const coins = {}
  const coinDirNames = {}

  await forEachDir(GENERAL_ASSETS_PATH, async ({ name }) => {
    const path = join(GENERAL_ASSETS_PATH, name, 'info.json')

    const coin = await parseJsonFile(path)

    if (coin.status !== 'active') {
      return
    }

    coinDirNames[coin.symbol] = name

    coins[coin.symbol] = {
      symbol: coin.symbol,
      name: coin.name,
      qrPrefix: coin.qqPrefix,
      minBalance: coin.minBalance,
      regexAddress: coin.regexAddress,
      decimals: coin.decimals,
      minTransferAmount: coin.minTransferAmount,
      contractId: coin.contractId,
      nodes: coin.nodes,
      createCoin: coin.createCoin,
      cryptoTransferDecimals: coin.cryptoTransferDecimals,
      defaultFee: coin.defaultFee,
      defaultVisibility: coin.defaultVisibility,
      defaultGasLimit: coin.defaultGasLimit,
      defaultGasPriceGwei: coin.defaultGasPriceGwei,
      txFetchInfo: coin.txFetchInfo,
      txConsistencyMaxTime: coin.txConsistencyMaxTime
    }
  })

  return [coins, coinDirNames]
}

async function applyBlockchains(coins) {
  const blockchainsPath = resolve('adamant-wallets', 'assets', 'blockchains')

  await forEachDir(blockchainsPath, async ({ name: blockchainName }) => {
    const blockchainPath = join(blockchainsPath, blockchainName)
    const infoPath = join(blockchainPath, 'info.json')

    const info = await parseJsonFile(infoPath)

    await forEachDir(blockchainPath, async ({ name: coinName }) => {
      const coinPath = join(blockchainPath, coinName, 'info.json')
      const coin = await parseJsonFile(coinPath)

      if (!coins[coin.symbol]) {
        return
      }

      coins[coin.symbol] = {
        ...coins[coin.symbol],
        ...coin,
        type: info.type,
        defaultGasLimit: info.defaultGasLimit,
        fees: info.fees
      }
    })
  })
}

async function copyIcons(coins, coinDirNames) {
  // remove all the icons
  await rm(CRYPTOS_ICONS_DIR_PATH, { recursive: true })
  await mkdir(CRYPTOS_ICONS_DIR_PATH)

  for (const [name, coin] of Object.entries(coins)) {
    if (coin.defaultVisibility) {
      const iconComponentName = `${strictCapitalize(coin.symbol)}Icon.vue`

      await copyFile(
        join(GENERAL_ASSETS_PATH, coinDirNames[name], 'images', 'icon.vue'),
        join(CRYPTOS_ICONS_DIR_PATH, iconComponentName)
      )
    }
  }
}

async function forEachDir(path, callback) {
  const dirents = await readdir(path, {
    withFileTypes: true
  })

  const promises = dirents.filter((dir) => dir.isDirectory()).map(callback)

  await Promise.all(promises)
}

async function parseJsonFile(path) {
  const json = await readFile(path, 'utf-8')

  return JSON.parse(json)
}
