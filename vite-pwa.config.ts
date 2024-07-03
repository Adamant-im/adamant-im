import { mergeConfig, defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import viteBaseConfig from './vite-base.config'
import { manifest } from './vite-config/manifest'

export default mergeConfig(
  viteBaseConfig,
  defineConfig({
    plugins: [
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
          maximumFileSizeToCacheInBytes: 5000000, // 5 MiB
          globPatterns: [
            '**/*.{js,css,html}',
            '**/*.{json,xml,txt}',
            '**/*.{ttf,eot,woff,woff2}', // fonts and icons
            '**/*.{png,jpg,svg,ico}', // images
            '**/*.{mp3,wasm}' // other
          ]
        }
      })
    ]
  })
)
