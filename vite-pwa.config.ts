import { mergeConfig, defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import viteBaseConfig from './vite-base.config'
import { manifest } from './vite-config/manifest'

export default mergeConfig(
  viteBaseConfig,
  defineConfig({
    plugins: [
      // https://msg-adamant-pr-646.surge.sh/assets/secp256k1-2IQOMy_D.wasm
      // #3816
      // trigger build
      VitePWA({
        registerType: 'autoUpdate',
        srcDir: 'src',
        filename: 'service-worker.js',
        devOptions: {
          enabled: false
        },
        manifest: manifest,
        manifestFilename: 'manifest.json',
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000 // 5 MiB
        }
      })
    ]
  })
)
