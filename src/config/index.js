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

const configName = import.meta.env.MODE || import.meta.env.ADM_CONFIG_FILE

export default configMap[configName]
