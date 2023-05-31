import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import autoprefixer from 'autoprefixer'
import { VitePWA } from 'vite-plugin-pwa'
import inject from '@rollup/plugin-inject'
import commonjs from '@rollup/plugin-commonjs'
import { ManualChunksOption } from 'rollup'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

import { dependencies } from './package.json'

function renderChunks(deps: Record<string, string>): ManualChunksOption {
  const vueChunks = ['vue', 'vuex', 'vue-router', 'vue-i18n', 'vuetify', 'vuex-persist']
  const excludedChunks = ['@mdi/font']

  const chunks = {
    ['vue-chunks']: vueChunks
  }
  Object.keys(deps).forEach((key) => {
    if (vueChunks.includes(key)) return
    if (excludedChunks.includes(key)) return
    chunks[key] = [key]
  })
  return chunks
}

/**
 * Exclude wordlists from `bip39` except for the english.json
 */
function excludeBip39Wordlists() {
  const wordlistsPath = 'node_modules/bip39/src/wordlists'

  const filesToExclude = fs
    .readdirSync(path.resolve(__dirname, wordlistsPath))
    .filter((fileName) => fileName !== 'english.json')

  return filesToExclude.map((fileName) =>
    fileURLToPath(new URL(`${wordlistsPath}/${fileName}`, import.meta.url))
  )
}

export default defineConfig({
  plugins: [
    vue(),
    commonjs(),
    inject({
      Buffer: ['buffer', 'Buffer']
    }),
    VitePWA({
      registerType: 'autoUpdate',
      srcDir: 'src',
      filename: 'service-worker.js',
      devOptions: {
        enabled: false
      }
    })
  ],
  css: {
    postcss: {
      plugins: [autoprefixer()]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),

      // Node.js polyfills
      buffer: 'buffer/',
      events: 'rollup-plugin-node-polyfills/polyfills/events',
      stream: 'stream-browserify',
      path: 'path-browserify',
      crypto: 'crypto-browserify',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify/browser',
      assert: 'assert'
    },
    extensions: ['.js', '.json', '.vue']
  },
  server: {
    port: 8080
  },
  define: {
    'process.env': {} // some old libs like `promise-queue` still uses Webpack
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    commonjsOptions: {
      include: []
    },
    rollupOptions: {
      output: {
        manualChunks: {
          ...renderChunks(dependencies)
        }
      },
      external: [...excludeBip39Wordlists()]
    }
  }
})
