import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import electron from 'vite-plugin-electron'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    build: {
      outDir: './dist-electron'
    },
    plugins: [
      electron({
        entry: 'src/electron/main.js'
      })
    ]
  })
)
