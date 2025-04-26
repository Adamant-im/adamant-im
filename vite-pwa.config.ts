import { defineConfig, mergeConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import viteBaseConfig from './vite-base.config'
import { manifest } from './vite-config/manifest'

export default defineConfig(() => {
  /** @see https://vite.dev/guide/api-javascript.html#mergeconfig */
  return mergeConfig(viteBaseConfig, {
    /** @see https://vite.dev/config/shared-options.html#define */
    define: {
      __VITE_ROUTER_HISTORY_MODE__: JSON.stringify(process.env.VITE_ROUTER_HISTORY_MODE)
    },
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
          globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
          maximumFileSizeToCacheInBytes: 5000000 // 5 MiB
        }
      })
    ]
  })
})
