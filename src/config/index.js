import devConfig from './development.json'
import prodConfig from './production.json'
import testingConfig from './test.json'
import testnetConfig from './testnet.json'
import torConfig from './tor.json'

const configMap = {
  development: devConfig,
  production: prodConfig,
  test: testingConfig,
  testnet: testnetConfig,
  tor: torConfig
}

let configName = import.meta.env.VITE_ADM_CONFIG_FILE

if (!(configName in configMap))
  configName = import.meta.env.MODE

export default configMap[configName]
