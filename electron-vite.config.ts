import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import { createRequire } from 'node:module'
import viteBaseConfig from './vite-base.config'
import { excludeScreenshotsPlugin } from './vite-config/plugins/excludeScreenshotsPlugin'

const require = createRequire(import.meta.url)
const electron = require('vite-plugin-electron')
  .default as typeof import('vite-plugin-electron').default

export default mergeConfig(
  viteBaseConfig,
  defineConfig({
    cacheDir: 'node_modules/.vite-electron',
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
