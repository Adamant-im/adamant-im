import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import wasm from 'vite-plugin-wasm'
import path from 'node:path'
import autoprefixer from 'autoprefixer'
import inject from '@rollup/plugin-inject'
import commonjs from '@rollup/plugin-commonjs'
import { fileURLToPath } from 'node:url'

import { deferScripsPlugin } from './vite-config/plugins/deferScriptsPlugin'
import { preloadCSSPlugin } from './vite-config/plugins/preloadCSSPlugin'
import { excludeBip39Wordlists } from './vite-config/rollup/excludeBip39Wordlists'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import VueDevTools from 'vite-plugin-vue-devtools'

const env = loadEnv('production', process.cwd())
const basePublicPath = env.VITE_PUBLIC_PATH || '/'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  base: basePublicPath,
  plugins: [
    wasm(),
    VueDevTools(),
    vue(),
    vueJsx(),
    commonjs(),
    inject({
      Buffer: ['buffer', 'Buffer']
    }),
    deferScripsPlugin(),
    preloadCSSPlugin(),
    nodePolyfills({
      include: ['util', 'process', 'buffer', 'events', 'stream'],
      globals: {
        Buffer: true,
        process: true
      }
    })
  ],
  css: {
    postcss: {
      plugins: [autoprefixer()]
    },
    preprocessorOptions: {
      scss: {
        api: 'legacy',
        includePaths: ['./src']
      }
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
      assert: 'assert',
      vm: path.resolve(__dirname, './src/lib/polyfills/vm.js')
    },
    extensions: ['.tsx', '.ts', '.js', '.json', '.vue']
  },
  server: {
    port: process.env.HTTPS === 'true' ? 5173 : 8080,
    https: process.env.HTTPS === 'true' ? {} : undefined
  },
  // Some old libs like `promise-queue` and `readable-stream` still uses Webpack.
  define: {
    'process.browser': 'true',
    'process.env': {}
  },
  optimizeDeps: {
    include: [
      'buffer',
      'vite-plugin-node-polyfills/shims/buffer',
      'vite-plugin-node-polyfills/shims/global',
      'vite-plugin-node-polyfills/shims/process'
    ],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    target: 'esnext',
    // Current app bundles include heavy crypto/runtime chunks by design.
    // Keep build output clean from non-actionable size warnings.
    chunkSizeWarningLimit: 4000,
    commonjsOptions: {
      include: []
    },
    rollupOptions: {
      external: [...excludeBip39Wordlists()],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.startsWith('materialdesignicons-webfont')) {
            return 'assets/[name][extname]'
          }

          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    css: {
      include: [/.+/]
    },
    server: {
      deps: {
        inline: ['vuetify']
      }
    }
  }
})
