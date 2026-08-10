import { defineConfig, loadEnv, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import wasm from 'vite-plugin-wasm'
import path from 'node:path'
import autoprefixer from 'autoprefixer'
import { fileURLToPath } from 'node:url'

import { deferScripsPlugin } from './vite-config/plugins/deferScriptsPlugin.ts'
import { preloadCSSPlugin } from './vite-config/plugins/preloadCSSPlugin.ts'
import { ecpairBufferImportPlugin } from './vite-config/plugins/ecpairBufferImportPlugin.ts'
import { cspHardeningPlugin } from './vite-config/plugins/cspHardeningPlugin.ts'
import VueDevTools from 'vite-plugin-vue-devtools'

const env = loadEnv('production', process.cwd())
const basePublicPath = env.VITE_PUBLIC_PATH || '/'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  base: basePublicPath,
  plugins: [
    cspHardeningPlugin(),
    wasm(),
    ecpairBufferImportPlugin(),
    process.env.VITE_DISABLE_DEVTOOLS === '1' ? undefined : VueDevTools(),
    vue(),
    vueJsx(),
    deferScripsPlugin(),
    preloadCSSPlugin()
  ],
  css: {
    preprocessorMaxWorkers: 0,
    postcss: {
      plugins: [autoprefixer()]
    },
    preprocessorOptions: {
      scss: {
        loadPaths: ['./src']
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),

      // Node.js polyfills
      buffer: 'buffer/',
      events: 'events/',
      process: 'process/browser',
      stream: 'stream-browserify',
      util: 'util/',
      path: 'path-browserify',
      vm: path.resolve(__dirname, './src/lib/polyfills/vm.js'),
      setimmediate: path.resolve(__dirname, './src/lib/polyfills/setImmediate.js')
    },
    extensions: ['.tsx', '.ts', '.js', '.json', '.vue']
  },
  server: {
    port: process.env.HTTPS === 'true' ? 5173 : 8080,
    https: process.env.HTTPS === 'true' ? {} : undefined
  },
  // Some old libs like `promise-queue` and `readable-stream` still uses Webpack.
  define: {
    global: 'globalThis',
    'process.browser': 'true',
    'process.env': {}
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
    rolldownOptions: {
      transform: {
        define: {
          global: 'globalThis'
        },
        inject: {
          Buffer: ['buffer', 'Buffer'],
          process: 'process'
        }
      }
    }
  },
  build: {
    target: 'esnext',
    // Current app bundles include heavy crypto/runtime chunks by design.
    // Keep build output clean from non-actionable size warnings.
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.startsWith('materialdesignicons-webfont')) {
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
}) as UserConfig
