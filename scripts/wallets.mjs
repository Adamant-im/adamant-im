import { $ } from 'execa'

import { copyFile, readdir, readFile, writeFile, mkdir, rm } from 'fs/promises'
import { resolve, join } from 'path'
import _ from 'lodash'

const CRYPTOS_DATA_FILE_PATH = resolve('src/lib/constants/cryptos/data.json')
const CRYPTOS_ICONS_DIR_PATH = resolve('src/components/icons/cryptos')
const GENERAL_ASSETS_PATH = resolve('adamant-wallets/assets/general')

run()

async function run() {
  // update adamant-wallets repo
  await $`git submodule foreach git pull origin master`

  const { coins, config, coinDirNames, coinSymbols } = await initCoins()
  await applyBlockchains(coins, coinSymbols)

  await copyIcons(coins, coinDirNames)

  await writeFile(CRYPTOS_DATA_FILE_PATH, JSON.stringify(coins, null, 2))

  await updateProductionConfig(config)
  await updateDevelopmentConfig(config)
  await updateTorConfig(config)
}

async function initCoins() {
  const config = {}
  const coins = {}

  const coinDirNames = {}
  const coinSymbols = {}

  await forEachDir(GENERAL_ASSETS_PATH, async ({ name }) => {
    const path = join(GENERAL_ASSETS_PATH, name, 'info.json')

    const coin = await parseJsonFile(path)

    if (coin.status !== 'active') {
      return
    }

    coinDirNames[coin.symbol] = name
    coinSymbols[name] = coin.symbol

    coins[coin.symbol] = {
      symbol: coin.symbol,
      name: coin.name,
      nameShort: coin.nameShort,
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
      fixedFee: coin.fixedFee,
      defaultVisibility: coin.defaultVisibility,
      defaultGasLimit: coin.defaultGasLimit,
      defaultGasPriceGwei: coin.defaultGasPriceGwei,
      txFetchInfo: coin.txFetchInfo,
      txConsistencyMaxTime: coin.txConsistencyMaxTime,
      defaultOrdinalLevel: coin.defaultOrdinalLevel,
      explorerTx: coin.explorerTx
    }

    if (coin.createCoin) {
      const nodeName = coin.symbol.toLowerCase()
      config[nodeName] = coin
    }
  })

  return {
    coins,
    config,
    coinDirNames,
    coinSymbols
  }
}

async function applyBlockchains(coins, coinSymbols) {
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
        mainCoin: coinSymbols[info.mainCoin],
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
      const iconComponentName = `${_.capitalize(coin.symbol)}Icon.vue`

      await copyFile(
        join(GENERAL_ASSETS_PATH, coinDirNames[name], 'images', 'icon.vue'),
        join(CRYPTOS_ICONS_DIR_PATH, iconComponentName)
      )
    }
  }
}

function updateProductionConfig(configs) {
  return updateConfig(configs, 'production')
}

function updateDevelopmentConfig(configs) {
  return updateConfig(configs, 'development')
}

function updateTorConfig(configs) {
  const torConfigs = Object.entries(configs)
    .map(([symbol, config]) => {
      const torConfig = _.mergeWith(config, config.tor, (value, srcValue) => {
        // customizer overrides `nodes`, `services` and `links`
        // instead of merging them
        if (_.isArray(srcValue)) {
          return srcValue
        }
      })

      return [symbol, torConfig]
    })
    .reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: value
      }),
      {}
    )

  return updateConfig(torConfigs, 'tor')
}

/**
 * Updates the config inside src/config
 */
async function updateConfig(configs, configName) {
  const configPath = resolve(`src/config/${configName}.json`)
  const configFile = await parseJsonFile(configPath)

  for (const configKey in configs) {
    const config = configs[configKey]

    configFile[configKey].explorer = config.explorer
    configFile[configKey].explorerTx = config.explorerTx
    configFile[configKey].explorerAddress = config.explorerAddress
    configFile[configKey].minNodeVersion = config.minNodeVersion
    configFile[configKey].nodes = config.nodes
    configFile[configKey].services = config.services
  }

  await writeFile(configPath, JSON.stringify(configFile, null, 2))
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
