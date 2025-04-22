import devConfig from './development.json'
import prodConfig from './production.json'
import testnetConfig from './testnet.json'
import torConfig from './tor.json'

const configMap = {
  development: devConfig,
  production: prodConfig,
  testnet: testnetConfig,
  tor: torConfig
}

const configName = import.meta.env.MODE

export default configMap[configName]
