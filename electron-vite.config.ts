import { defineConfig, mergeConfig } from 'vite'
import { createRequire } from 'node:module'
import viteBaseConfig from './vite-base.config'
import { excludeScreenshotsPlugin } from './vite-config/plugins/excludeScreenshotsPlugin'

const require = createRequire(import.meta.url)
const electron = require('vite-plugin-electron')
  .default as typeof import('vite-plugin-electron').default
const electronDevCspHeader = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `script-src 'self' 'wasm-unsafe-eval'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: http: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' ws: wss: http: https: blob:`,
  `worker-src 'self' blob:`,
  `media-src 'self' data: blob:`
].join('; ')

export default mergeConfig(
  viteBaseConfig,
  defineConfig({
    cacheDir: 'node_modules/.vite-electron',
    server: {
      headers: {
        'Content-Security-Policy': electronDevCspHeader
      }
    },
    preview: {
      headers: {
        'Content-Security-Policy': electronDevCspHeader
      }
    },
    build: {
      outDir: './dist-electron'
    },
    plugins: [
      electron({
        entry: 'src/electron/main.js'
      }),
      excludeScreenshotsPlugin()
    ]
  })
)
