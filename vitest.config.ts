import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import viteConfig from './vite-base.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      alias: {
        process: 'node:process'
      },
      globals: true,
      environment: 'jsdom',
      css: false,
      exclude: [...configDefaults.exclude, 'e2e/*', 'tests/e2e/**', 'adamant-wallets/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['./tests/unit/setup.js']
    }
  })
)
