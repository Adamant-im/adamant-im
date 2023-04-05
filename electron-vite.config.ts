import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import electron from 'vite-plugin-electron'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [
      electron({
        entry: 'electron/main.js'
      })
    ]
  })
)
