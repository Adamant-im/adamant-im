import { $ } from 'execa'

import { copyFile, readdir, readFile, writeFile, mkdir, rm } from 'fs/promises'
import { resolve, join } from 'path'
import _ from 'lodash'

const CRYPTOS_DATA_FILE_PATH = resolve('src/lib/constants/cryptos/data.json')
const CRYPTOS_ICONS_DIR_PATH = resolve('src/components/icons/cryptos')
const GENERAL_ASSETS_PATH = resolve('adamant-wallets/assets/general')
const BRANCH = process.argv[2]

void run(BRANCH)

/**
 *
 * @param {string} branch The branch to pull from. E.g.: dev, master
 * @return {Promise<void>}
 */
async function run(branch = 'master') {
  // update adamant-wallets repo
  await $`git submodule init`
  await $`git submodule update`
  await $`git submodule foreach git pull origin ${branch}`

  console.log('Updating coins data from `adamant-wallets`. Using branch:', branch)

  const { coins, config, coinDirNames, coinSymbols } = await initCoins()
  await applyBlockchains(coins, coinSymbols)

  await copyIcons(coins, coinDirNames)

  await writeFile(CRYPTOS_DATA_FILE_PATH, JSON.stringify(coins, null, 2))

  await updateProductionConfig(config)
  await updateDevelopmentConfig(config)
  await updateTestnetConfig(config)
  await updateTorConfig(config)

  console.log('Coins updated successfully')
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

    coins[coin.symbol] = coin

    if (coin.createCoin) {
      const nodeName = coin.symbol.toLowerCase()
      config[nodeName] = coin
    }
  })

  // Sort by key (coin symbol)
  const sortedCoins = _.chain(coins).toPairs().sortBy(0).fromPairs().value()

  return {
    coins: sortedCoins,
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
    const mainCoinInfo = coinSymbols[info.mainCoin] ? coins[coinSymbols[info.mainCoin]] : {}

    await forEachDir(blockchainPath, async ({ name: coinName }) => {
      const coinPath = join(blockchainPath, coinName, 'info.json')
      const coin = await parseJsonFile(coinPath)

      let tokenData = coins[coin.symbol] || {}

      if (!coins[coin.symbol]) {
        const generalTokenPath = join(GENERAL_ASSETS_PATH, coinName, 'info.json')
        const generalTokenInfo = await parseJsonFile(generalTokenPath)
        if (generalTokenInfo.status === 'active') {
          tokenData = generalTokenInfo
        }
      }

      const result = {
        ...mainCoinInfo,
        ...tokenData,
        ..._.omit(info, ['mainCoin']),
        ...coin
      }

      coins[coin.symbol] = {
        ...result,
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
    const iconComponentName = `${_.capitalize(coin.symbol)}Icon.vue`

    const iconPathDestination = join(CRYPTOS_ICONS_DIR_PATH, iconComponentName)
    await copyFile(
      join(GENERAL_ASSETS_PATH, coinDirNames[name], 'images', 'icon.vue'),
      iconPathDestination
    )
    await $`git add ${iconPathDestination}` // git track newly added icon
  }
}

function updateProductionConfig(configs) {
  return updateConfig(configs, 'production')
}

function updateDevelopmentConfig(configs) {
  return updateConfig(configs, 'development')
}

function updateTestnetConfig(configs) {
  const testnetConfigs = _.mapValues(configs, (config) => {
    if (config.testnet) config.nodes.list = config.testnet.nodes.list

    return config
  })

  return updateConfig(testnetConfigs, 'testnet')
}

function updateTorConfig(configs) {
  const torConfigs = _.mapValues(configs, (config) => {
    const torConfig = _.mergeWith(config, config.tor, (value, srcValue) => {
      // customizer overrides `nodes`, `services` and `links`
      // instead of merging them
      if (_.isArray(srcValue)) {
        return srcValue
      }
    })

    return torConfig
  })

  return updateConfig(torConfigs, 'tor')
}

/**
 * Updates the config inside src/config
 */
async function updateConfig(configs, configName) {
  const configPath = resolve(`src/config/${configName}.json`)
  const configFile = await parseJsonFile(configPath)

  // Remove obsolete coins that no longer exist in configs
  for (const existingKey in configFile) {
    if (!configs[existingKey]) {
      delete configFile[existingKey]
    }
  }

  // Add/update coins from configs
  for (const configKey in configs) {
    const config = configs[configKey]

    if (!configFile[configKey]) {
      configFile[configKey] = {}
    }

    configFile[configKey].explorer = config.explorer
    configFile[configKey].explorerTx = config.explorerTx
    configFile[configKey].explorerAddress = config.explorerAddress
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
